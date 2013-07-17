var Q = require('Q')
var request = require('request')
var xml2js = require('xml2js')
var parseRSS = require('../server/feeds').parseRSS
var crypto = require("crypto")
var cluster = require("cluster")

var redis = require("redis").createClient()
var redisQ = require("../lib/redisQ")(redis)

var config = {
	host: 'localhost',
	user: 'recess',
	password: 'horse',
	database: 'recess'
}

var db = require('../server/db')(config)

//		fetchFeed(channel).then(parseRSS).then(insertFeed(channel)).catch(console.log)

// TODO: Rewrite this, horrible mess.
var CHANNEL_QUEUE = "queue.channel"

if(cluster.isMaster) {
	var os = require("os")
	var cpus = os.cpus().length

	var workers = []

	for(var i = 0; i < cpus; i++) {
		var worker = cluster.fork()

		worker.on("error", function(err) {
			console.log(err)
		})

		workers[i] = worker
	}

	var run = function() {
		db.getChannels().then(function(channels) {
			channels.forEach(function(channel) {
				redis.rpush(CHANNEL_QUEUE, JSON.stringify(channel), function(err, res) {
					if(err) {
						console.log(err)
					}
				})
			})
		}).catch(function(err) {
			console.log(err.stack)
		})
	}

	// Dont want to delete the queue while we have workers waiting or while we insert.
	redis.del(CHANNEL_QUEUE, function() {
		var id = setInterval(run, 5 * 60 * 1000)

		run()
	})

	return
}

var log = function(msg) {
	if(typeof(msg) !== 'string') {
		msg = JSON.stringify(msg, null, 2)
	}

	console.log("[" + new Date() + "][" + cluster.worker.id + "] " + msg)
}

// Logs an error from a Q
var logErr = function(err) {
	log(err.stack)
}

/* TODO: Move this into unified redis lib */
var getEtagFromRedis = function(channel) {
	return redisQ.hgetall("channel.http.cache." + channel.channel_id)
}

var setEtagRedis = function(channel, cache) {
	return redisQ.hmset("channel.http.cache." + channel.channel_id, cache)
}

var requestQ = function(url) {
	var defer = Q.defer()

	request(url, function(err, res, body) {
		if (err || res.statusCode >= 400) {
			return defer.reject(res)
		}

		return defer.resolve({
			body:body,
			res:res
		})
	})

	return defer.promise
}

// Store etags and Last-Modified headers in redis

var handleHTTPCache = function(channel) {
	return function(o) {

		var body = o.body
		var res = o.res

		if(res.statusCode === 304) {
			return
		}

		var cacheControl = res.headers["cache-control"]
		if(cacheControl) {
			var control = cacheControl.split(", ")
			for(var i = 0; i < control.length; i++) {
				if(control[i] === 'no-cache') {
					return body
				}
			}
		}

		var toCache
		if(res.headers.etag) {
			toCache = toCache || {}
			toCache["etag"] = res.headers["etag"]
		}

		if(res.headers["last-modified"]) {
			toCache = toCache || {}
			toCache["last-modified"] = res.headers["last-modified"]
		}

		if(toCache) {
			setEtagRedis(channel, toCache).catch(logErr)
		}

		return body
	}
}

var parseRssDate = function(rssDate) {
	// Time to attempt to parse every rss date format in the world
	return new Date(rssDate)
}

var hash = function(s) {
	var hash = crypto.createHash("sha256")
	hash.update(s)
	return hash.digest("hex")
}

var hashItem = function(item) {
	return hash(item.link[0])
}

var contains = function(list, x) {
	for(var i in list) {
		if(list[i] === x) {
			return true
		}
	}

	return false
}

var id = function(x) { return x }

var getFeedURL = function(channel) {
	return function(cached) {
		var config = {
			uri: channel.url,
			headers: {}
		}

		// Lookup cached etag for channel
		if(cached) {
			if(cached.etag) {
				config.headers["if-none-match"] = cached.etag
			}

			if(cached["last-modifed"]) {
				config.headers["if-modified-since"] = cached["last-modifed"]
			}
		}

		return config
	}
}

var fetchFeed = function(channel) {
	return getEtagFromRedis(channel).then(getFeedURL(channel)).then(requestQ).then(handleHTTPCache(channel))
}

var getGUID = function(guid) {
	var type = typeof(guid)
	switch(type) {
		case 'string': return guid
		case 'object': {
			if(guid._ !== undefined && typeof(guid._) === 'string') {
				return guid._
			} else {
				return 'unknown - guid'
			}
		}
		default: return guid
	}
}


var getItemsToInsert = function(channel, items) {
	return redisQ.smembers("fetched.items." + channel).then(function(stored) {
		return items.filter(function(x) {
			return !contains(stored, hashItem(x))
		}).reverse()
	})
}

var getCachedItems = function(channel) {
	return redisQ.sget("fetched.items." + channel)
}

var insertFeed = function(channel) {
	return function(feed) {
		var rss = feed.rss.channel[0]
		return getItemsToInsert(channel.channel_id, rss.item).then(function(items) {
			return Q.allSettled(items.map(function(item) {
				var o = {
					channel_id: channel.channel_id,
					title: item.title[0],
					link: item.link[0],
					description: item.description ? item.description[0] : "<no content>",
					guid: getGUID(item.guid[0]),
					hash: hash(item.link[0]),
					published: parseRssDate(item.pubDate[0])
				}

				redisQ.sadd("fetched.items." + channel.channel_id, o.hash).catch(logErr)
				return db.query("INSERT INTO items SET ?", o).then(function(res) {
					log(channel.title + " => " + o.title)
				})
			}))
		})

		// Q.allSettled(promises).then(function(result) {
		// 	if(result.state === 'fulfilled') {
		// 		// console.log("Inserted all values")
		// 	} else {
		// 		console.log("INSERT ERROR = " + result.reason)
		// 	}
		// })
	}
}

Q.longStackSupport = true
var run
run = function() {
	brpop(CHANNEL_QUEUE, 0).then(function(channel) {
		channel = JSON.parse(channel[1])
		//console.log(channel.ttl)
		//log("Checking for new items from " + channel.title)
		return fetchFeed(channel).then(function(rss) {
			if(rss) {
				return parseRSS(rss).then(insertFeed(channel))
			}
		})
	}).then(run).catch(function(err) {
		log(err.stack)
		run()
	})
}

run()