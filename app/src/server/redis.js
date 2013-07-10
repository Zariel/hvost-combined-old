var redis = require("redis").createClient()
var Q = require("Q")

var redisQ = function(defer) {
	return function(err, res) {
		if(err) {
			return defer.reject(err)
		}

		return defer.resolve(res)
	}
}

module.exports.setFeedLatest = function(channel, modified) {
	var defer = Q.defer()

	redis.hset("feed.modified", channel, modified, redisQ(defer))

	return defer.promise
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