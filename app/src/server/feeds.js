var request = require('request')
var Q = require('Q')
var xml2js = require('xml2js')

var requestQ = function(url) {
	var defer = Q.defer()

	request(url, function(err, res, body) {
		if (err) {
			err.url = url
			return defer.reject(err)
		}

		return defer.resolve(body)
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

var add = function(db, url, group, title) {
	return requestQ(url).then(parseRSS).then(function(data) {
		var rss = data.rss.channel[0]
		var query = 'INSERT INTO Channels SET last_update = NOW() - 1, ?'

		var vals = {
			title: title || rss.title[0],
			group_id: group || 0,
			description: rss.description[0],
			ttl: (rss.ttl != null ? rss.ttl[0] : 5) * 60,
			url: url,
			link: rss.link[0]
		}
		console.log(vals)

		return db.query(query, vals)
	})
}

module.exports = {
	add: add,
	parseRSS: parseRSS
}
