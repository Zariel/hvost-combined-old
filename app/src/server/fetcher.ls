require! Q
require! request

# need to be able to fetch an rss feed and update it periodically.
fetchFeed = (url) ->
	defer = Q.defer!

	request url, (err, res, body) ->
		if err or res.statusCode >= 400
			return defer.reject res

		defer.resolve body

	defer.promise

start = (db) ->

module.exports = {
	start
}