feeds = require './feeds'

require! express
require! path

server = (db) ->
	app = express!

	servDir = path.join __dirname, '../../../web/build'

	app.use (req, res, next) ->
		req.url = '/index.html' if req.url is '/'

		console.log "%s - %s", req.method, req.url

		next!

	app.use express.json!
	app.use express.compress!

	app.post '/api/feed/add', (req, res) ->
		url = req.body['url']

		return res.send 400, 'Error' if not url

		feeds.add db, url
			..then ->
			, (err) ->
				console.log err

		res.send 200, "OK"

	app.get '/api/channels', (req, res) ->
		feeds.getChannels db
			..then (result) ->
				chans = map (chan) ->
					chan.id = chan.channel_id
					delete chan.channel_id
					chan
				, result

				res.json 200, chans
			, (err) ->
				res.send 500

	app.post '/api/feed/remove/:id', (req, res) ->
		id = req.params['id']

		res.send id

	app.get '/api/feed/:id', (req, res) ->
		url = req.query['q']

	app.use express.static servDir

	app.use (req, res, next) ->
		res.send 404

	app.listen 3000

	app

module.exports = {
	server
}