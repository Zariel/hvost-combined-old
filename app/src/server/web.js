var feeds = require('./feeds')
var express = require('express')
var path = require('path')
var redis = require("./redis")

var exWrap = function(res, promise) {
	promise.catch(function(err) {
		console.log(err)
		return res.send(500)
	})
}

var server = function(db) {
	var app = express()
	var servDir = path.join(__dirname, '../../../web/build')

	app.use(function(req, res, next) {
		console.log("%s - %s", req.method, req.url)

		return next()
	})

	app.use(express.json())
	app.use(express.compress())

	app.post('/api/feed/add', function(req, res) {
		var url = req.body['url']
		if (!url) {
			return res.send(400, 'Error')
		}

		exWrap(feeds.add(db, url).then(function() {
			res.send(200)
		}))
	})

	app.get('/api/channels', function(req, res) {
		exWrap(res, db.getChannels().then(function(result) {
			var chans = result.map(function(chan) {
				chan.id = chan.channel_id
				delete chan.channel_id

				return chan
			})

			return res.json(200, chans)
		}))
	})

  // TODO: Replace this with DELETE
 //  app.post('/api/feed/:id', function(req, res) {
	// var id = req.params['id']

	// res.send(id)
 //  })

	// TODO: Move this to Redis!
	var feedCache = {}
	app.get('/api/feed/:id', function(req, res) {
		var id = req.params.id
		if(!id) {
			return res.send(400)
		}

		var modSince = req.get("If-Modified-Since")

		redis.getFeedLatest(id).then(function(cached) {

			if(cached) {
				if(modSince >= cached) {
					return res.send(304)
				}
			}
		})

		exWrap(res, db.getFeed(id).then(function(feeds) {
			// todo: Only send feeds which are pubed >= If-Modified-Since
			var last

			feeds = feeds.map(function(feed) {
				feed.id = feed.item_id

				if(!last || feed.published > last) {
					last = feed.published
				}

				delete feed.item_id
				delete feed.hash

				return feed
			})

			if(!last) {
				last = modSince
			}

			res.set({
			 	"Last-Modified": last,
			 	"Cache-Control": "public, max-age=300"
			})

			redis.setFeedLatest(id, last)
			res.json(200, feeds)
		}))
	})

	app.get('/api/feed/:id/read', function(req, res) {
		var id = req.params.id
		if(!id) {
			return res.send(400)
		}

		exWrap(res, db.markRead(id).then(db.getFeedItem(id).then(function(items) {
			var item = items[0]
			item.id = item.item_id

			delete item.hash
			delete item.item_id

			res.json(200, item)
		})))
	})

	app.get('/api/feed/unread/:id', function(req, res) {
		var id = req.params.id
	})

	app.use(function(req, res, next) {
		return res.send(404)
	})

	var port = 3000
	app.listen(port)

	console.log("listening on port " + port)

	return app
}

module.exports = {
	server: server
}
