var Q = require('Q')
var request = require('request')
var xml2js = require('xml2js')
var parseRSS = require('../server/feeds').parseRSS
var crypto = require("crypto")
var cluster = require("cluster")

var redis = require("redis").createClient()

var config = {
	host: 'localhost',
	user: 'recess',
	password: 'horse',
	database: 'recess'
}

var db = require('../server/db')(config)

//		fetchFeed(channel).then(parseRSS).then(insertFeed(channel)).catch(console.log)

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

	var fetchFeeds = function(channels) {
	}

	var run = function() {
		db.getChannels().then(function(channels) {
			channels.forEach(function(channel) {
				redis.rpush(CHANNEL_QUEUE, JSON.stringify(channel))
			})
		}).catch(console.log)
	}

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

	console.log("[" + new Date() + "]][" + cluster.worker.id + "] " + msg)
}

/* TODO: Move this into unified redis lib */
var redisQ = function(defer) {
	return function(err, res) {
		if(err) {
			return defer.reject(err)
		}

		return defer.resolve(res)
	}
}

var brpop = function(list, timeout) {
	var defer = Q.defer()

	redis.brpop(list, timeout, redisQ(defer))

	return defer.promise
}

var getEtagFromRedis = function(channel) {
	var defer = Q.defer()

	redis.hgetall("channel.http.cache." + channel.channel_id, redisQ(defer))

	return defer.promise
}

var setEtagRedis = function(channel, cache) {
	var defer = Q.defer()

	redis.hmset("channel.http.cache." + channel.channel_id, cache, redisQ(defer))

	return defer.promise
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

var logQ = function(err) {
	console.log(err.stack)
}

// Store etags and Last-Modified headers in redis

var handleHTTPCache = function(channel) {
	return function(o) {

		var body = o.body
		var res = o.res

		if(res.statusCode === 304) {
			log("Got 304 from " + channel.title)
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
			setEtagRedis(channel, toCache).catch(logQ)
		}

		return body
	}
}

var fetchFeed = function(channel) {
	var config = {
		uri: channel.url,
		headers: {}
	}

	return getEtagFromRedis(channel).then(function(cached) {
		// LiveScript would make this syntax nice, though I wish Q would allow multiple args to be
		// resolved at once. Maybe PR

		// Lookup cached etag for channel
		if(cached) {
			if(cached.etag) {
				config.headers["if-none-match"] = cached.etag
			}
			if(cached["last-modifed"]) {
				config.headers["if-modified-since"] = cached["last-modifed"]
			}
		}

		return requestQ(config).then(handleHTTPCache(channel)).then(function(res) {
			if(res) {
				return res
			}
		})
	})
}

var parseRssDate = function(rssDate) {
	// Time to attempt to parse every rss date format in the world
	return new Date(rssDate)
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

var hash = function(s) {
	var hash = crypto.createHash("sha256")
	hash.update(s)
	return hash.digest("hex")
}

var setCachedItems = function(channel, items) {
	var defer = Q.defer()

	var feed = items.map(hashItems)

	redis.sadd()

	return defer.promise
}

var hashItems = function(x) {
	return hash(x.link[0])
}

var sadd = function(key, items) {
	var defer = Q.defer()

	redis.sadd(key, items, redisQ(defer))

	return defer.promise
}

var sdiff = function(a, b) {
	var defer = Q.defer()

	redis.sdiff(a, b, redisQ(defer))

	return defer.promise
}

var smembers = function(set) {
	var defer = Q.defer()

	redis.smembers(set, redisQ(defer))

	return defer.promise
}

var getItemsToInsert = function(channel, items) {
	return smembers("fetched.items." + channel).then(function(stored) {
		return items.filter(function(x) {
			return !contains(stored, hashItems(x))
		}).reverse()
	})
}

var getCachedItems = function(channel) {
	var defer = Q.defer()

	redis.sget("fetched.items." + channel, redisQ(defer))

	return defer.promise
}

var contains = function(list, x) {
	for(var i in list) {
		if(list[i] === x) {
			return true
		}
	}

	return false
}

var insertFeed = function(channel) {
	return function(feed) {
		var rss = feed.rss.channel[0]
		return getItemsToInsert(channel.channel_id, rss.item).then(function(items) {
			return items.map(function(item) {
				var o = {
					channel_id: channel.channel_id,
					title: item.title[0],
					link: item.link[0],
					description: item.description[0],
					guid: getGUID(item.guid[0]),
					hash: hash(item.link[0]),
					published: parseRssDate(item.pubDate[0])
				}

				sadd("fetched.items." + channel.channel_id, o.hash).catch(console.log)
				return db.query("INSERT INTO items SET ?", o).then(function(res) {
					log("Successfully inserted " + o.title)
				})
			})
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

var run
run = function() {
	brpop(CHANNEL_QUEUE, 0).then(function(channel) {
		channel = JSON.parse(channel[1])
		log("Checking for new items from " + channel.title)
		return fetchFeed(channel).then(parseRSS).then(insertFeed(channel))
	}).then(run).catch(function(err) {
		throw err
	})
}

run()