var feeds = require('./feeds')
var express = require('express')
var path = require('path')
var redis = require("./redis")
var auth = require("./auth")
var P = require("path")

var exWrap = function(res, promise) {
	promise.catch(function(err) {
		console.log(err.stack)
		return res.send(500)
	})
}
var cleanItem = function(item) {
	item.id = item.item_id

	delete item.hash
	delete item.item_id

	return item
}

var server = function(db) {
	var app = express()

	app.use(function(req, res, next) {
		console.log("%s - %s", req.method, req.url)

		return next()
	})

	app.use(function(req, res, next) {
		var path = req.path

		if(P.dirname(path) === '/api/auth') {
			return next()
		}

		var key = req.get('api-key')

		if(key === undefined) {
			return res.send(401, 'request must include a valid api key in the "api-key" header.')
		}

		auth.isValid(key).then(function(valid) {
			if(valid) {
				return next()
			}

			return res.send(401, 'request must include a valid api key in the "api-key" header.')
		})
	})

	app.use(express.json())
	app.use(express.compress())

	/*
	 * Post body of username + password, respond with api-key or 401
	 * {
	 * 	username: 'name',
	 * 	password: 'password'
	 * }
	 * =>
	 * {
	 * 	'api-key': 'key..'
	 * }
	 */

	app.post('/api/auth/login', function(req, res) {
		var name = req.body.username
		var passw = req.body.password

		if(name === undefined || passw === undefined) {
			return res.send(400)
		}

		exWrap(res, auth.login(name, passw).then(function(key) {
			res.json({"api-key": key})
		}, function(err) {
			console.log(err.stack)
			res.send(401, 'invalid username or password.')
		}))
	})

	app.get('/api/auth/logout', function(req, res) {
		var key = req.get('api-key')
		if(key === undefined) {
			// logout without key a noop
			return res.send(200)
		}

		exWrap(res, auth.logout(key).then(function() {
			res.send(200)
		}))
	})

	app.post('/api/channels/add', function(req, res) {
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
			var chans = {}

			result.forEach(function(chan) {
				chan.id = chan.channel_id
				delete chan.channel_id

				chans[chan.group_id] = chans[chan.group_id] || {
					group_id: chan.group_id,
					group_name: chan.group_name,
					channels: []
				}

				chans[chan.group_id].channels.push(chan)
			})

			res.json(200, chans)
		}))
	})

	app.get('/api/feed', function(req, res) {
		var from = req.query.from
		var count = req.query.count

		if(from !== undefined && count !== undefined) {
			from = parseInt(from)
			count = parseInt(count)

			exWrap(res, db.getAllFeeds(from, count).then(function(items) {
				res.json(200, items.map(cleanItem))
			}))
		} else {
			res.send(400)
		}
	})

	/*
	 * Get all items in a feed, currently unread.
	 */
	app.get('/api/feed/:id', function(req, res) {
		var id = req.params.id
		if(!id) {
			return res.send(400)
		}

		var from = req.query.from
		var count = req.query.count

		var modSince = req.get("if-modified-since")

		/*
		 * TODO: Replace this with an etag system so feeds will be updated when the
		 * items are read.
		*/
		exWrap(res, redis.getFeedLatest(id).then(function(cached) {
			if(cached) {
				if(modSince >= cached) {
					return res.send(304)
				}
			}

			var feedHandler = function(feeds) {
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
					"Cache-Control": "public, max-age=300",
					"Last-Modified": last
				})

				redis.setFeedLatest(id, last)
				return res.json(200, feeds)
			}

			if(from !== undefined && count !== undefined) {
				from = parseInt(from)
				count = parseInt(count)

				return db.getFeedLimit(id, from, count).then(feedHandler)
			} else {
				return db.getFeed(id).then(feedHandler)
			}
		}))
	})

	/*
	 * Mark a feed item as read
	 */
	app.put('/api/feed/:id/read', function(req, res) {
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

	app.get('/api/group/:id', function(req, res) {
		var id = req.params.id

		if(!id) {
			return res.send(400)
		}

		exWrap(res, db.getGroupFeed(id).then(function(items) {
			res.json(200, items.map(cleanItem))
		}))
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
