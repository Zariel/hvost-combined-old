var Q = require('Q')
var request = require('request')
var xml2js = require('xml2js')
var parseRSS = require('./feeds').parseRSS
var crypto = require("crypto")

var config = {
	host: 'localhost',
	user: 'recess',
	password: 'horse',
	database: 'recess'
}

var db = require('./db')(config)

var fetchFeed = function(feed) {
	var url = feed.url
	var defer = Q.defer()

	request(url, function(err, res, body) {
		if (err || res.statusCode >= 400) {
			return defer.reject(res)
		}

		return defer.resolve(body)
	})

	return defer.promise
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

var insertFeed = function(channel) {
	return function(feed) {
		var rss = feed.rss.channel[0]
		var items = rss.item

		var promises = items.map(function(item) {
			var o = {
				channel_id: channel.channel_id,
				title: item.title[0],
				link: item.link[0],
				description: item.description[0],
				guid: getGUID(item.guid[0]),
				hash: hash(item.link[0]),
				published: parseRssDate(item.pubDate[0])
			}

			return db.query("INSERT INTO items SET ?", o).then(function(res) {
				console.log("Succfully inserted " + o.title)
			}, function(err) {
				console.log(err)
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

var fetchFeeds = function(channels) {
	channels.forEach(function(channel) {
		fetchFeed(channel).then(parseRSS).then(insertFeed(channel)).catch(console.log)
	})
}

run = function() {
	db.getChannels().then(fetchFeeds).catch(console.log)
}

run()
