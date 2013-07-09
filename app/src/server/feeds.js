var request = require('request')
var Q = require('Q')
var xml2js = require('xml2js')

var requestQ = function(url) {
	var defer = Q.defer()

	request(url, function(err, res, body) {
		if (err) {
			return defer.reject
		}

		return defer.resolve(body, res)
	})

	return defer.promise
}

var parseRSS = function(string) {
	var defer = Q.defer()
	xml2js.parseString(string, function(err, data) {
		if (err) {
			return defer.reject(err)
		}

		return defer.resolve(data)
	})

	return defer.promise
}

var add = function(db, url) {
	return requestQ(url).then(parseRSS).then(function(data) {
		var rss = data.rss.channel[0]
		var vals = [rss.title[0], rss.description[0], ((rss != null ? (ref$ = rss.ttl) != null ? ref$[0] : void 8 : void 8) || 30) * 60, url, rss.link[0]]
		var query = 'INSERT INTO Channels(title, description, ttl, url, link, last_update) VALUES(?, ?, ?, ?, ?, NOW() - 1)'

		return db.query(query, vals)
	})
}

module.exports = {
	add: add,
	parseRSS: parseRSS
}
