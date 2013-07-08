var feeds = require('./feeds')
var express = require('express')
var path = require('path')

var server = function(db) {
  var app = express()
  var servDir = path.join(__dirname, '../../../web/build')

  app.use(function(req, res, next) {
	if (req.url === '/') {
	  req.url = '/index.html'
	}

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

	feeds.add(db, url).then(function() {}, function(err) {
	  return console.log(err)
	})

	res.send(200, "OK")
  })

  app.get('/api/channels', function(req, res) {
	feeds.getChannels(db).then(function(result) {
	  var chans = result.map(function(chan) {
		chan.id = chan.channel_id
		delete chan.channel_id

		return chan
	  })

	  return res.json(200, chans)
	}, function(err) {
	  return res.send(500)
	})
  })

  app.post('/api/feed/remove/:id', function(req, res) {
	var id = req.params['id']

	res.send(id)
  })

  app.get('/api/feed/:id', function(req, res) {
	var url = req.query['q']
  })

  app.use(express['static'](servDir))
  app.use(function(req, res, next) {
	return res.send(404)
  })

  app.listen(3000)

  return app
}

module.exports = {
  server: server
}
