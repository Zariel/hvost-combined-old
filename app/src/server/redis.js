var redis = require("redis").createClient()
var Q = require("Q")

module.exports.setFeedLatest = function(channel, modified) {
	redis.hset("feed.modified", channel, modified)
}

module.exports.getFeedLatest = function(channel) {
	var defer = Q.defer()

	redis.hget("feed.modified", channel, function(err, val) {
		if(err) {
			return defer.reject(err)
		}

		defer.resolve(val)
	})

	return defer.promise
}