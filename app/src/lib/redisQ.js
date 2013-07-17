var Q = require("Q")

var redisQ = function(defer) {
	return function(err, res) {
		if(err) {
			return defer.reject(err)
		}

		return defer.resolve(res)
	}
}

module.exports = function(redis) {
	
	this.brpop = function(list, timeout) {
		var defer = Q.defer()

		redis.brpop(list, timeout, redisQ(defer))

		return defer.promise
	}

	this.hmset = function(key, vals) {
		var defer = Q.defer()

		redis.hmset(key, vals, redisQ(defer))

		return defer.promise
	}

	this.hgetall = function(key) {
		var defer = Q.defer()

		redis.hgetall(key, redisQ(defer))

		return defer.promise
	}

	this.sadd = function(key, items) {
		var defer = Q.defer()

		redis.sadd(key, items, redisQ(defer))

		return defer.promise
	}

	this.sdiff = function(a, b) {
		var defer = Q.defer()

		redis.sdiff(a, b, redisQ(defer))

		return defer.promise
	}

	this.smembers = function(set) {
		var defer = Q.defer()

		redis.smembers(set, redisQ(defer))

		return defer.promise
	}

	this.sget = function(set) {
		var defer = Q.defer()

		redis.sget(set, redisQ(defer))

		return defer.promise
	}

	return this
}
