require! request
require! Q
require! xml2js

requestQ = (url) ->
	defer = Q.defer!

	request url, (err, res, body) ->
		return defer.reject if err if err

		defer.resolve body, res

	defer.promise

parseString = (string) ->
	defer = Q.defer!

	xml2js.parseString string, (err, data) ->
		return defer.reject err if err

		defer.resolve data

	defer.promise


add = (db, url) ->
	requestQ url .then parseString .then (data) ->
		rss = data.rss.channel[0]
		vals = [rss.title[0], rss.description[0], (rss?ttl?[0] or 30) * 60, url, rss.link[0]]
		query = 'INSERT INTO Channels(title, description, ttl, url, link, last_update) VALUES(?, ?, ?, ?, ?, NOW() - 1)'
		db.query query, vals

getChannels = (db) ->
	db.query 'SELECT * FROM Channels ORDER BY title;'

module.exports = {
	add
	getChannels
}