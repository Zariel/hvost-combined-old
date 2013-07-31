var Q = require("Q")

var redisClient = require("redis").createClient()
var redis = require("../lib/redisQ")(redisClient)

var authLib = require("../lib/auth")
var crypto = require("crypto")

var config = {
	host: 'localhost',
	user: 'recess',
	password: 'horse',
	database: 'recess'
}

var db = require("./db")(config)

var API_KEY = "user.apikey"
var EXPIRE_TIME = 15 * 60

var createApiKey = function(user, passw) {
	var hash = crypto.createHash("sha512")
	var time = new Date().getTime()
	hash.update(time.toString())
	hash.update(user)
	hash.update(passw)

	return hash.digest("hex").slice(0, 32).toString("hex")
}

var updateTTL = function() {
	redis.expire(API_KEY, EXPIRE_TIME).catch(function(err) {
		console.log(err.stack)
	})
}

var storeKey = function(key) {
	return redis.set(API_KEY, key).then(function() {
		updateTTL()
		return key
	})
}

var isValid = function(key) {
	return redis.get(API_KEY).then(function(res) {
		if(!res || res !== key) {
			return false
		}

		updateTTL()

		return true
	})
}

var getApiKey = function(name, passw) {
	// either get the key from redis or create a new one
	// reuse API keys so that the same user can be logged in
	// from the multiple devices at the same time.
	return redis.get(API_KEY).then(function(key) {
		if(key) {
			updateTTL()

			return key
		} else {
			key = createApiKey(name, passw)

			return storeKey(key)
		}
	})
}

var login = function(name, passw) {
	return db.getUser(name).then(function(res) {
		if(res.length !== 1) {
			throw new Error("No user registered")
		}

		var details = res[0]
		if(authLib.isPasswordValid(passw, details.password)) {
			return getApiKey(name, details.password)
		}

		throw new Error("Password is invalid")
	})
}

var logout = function(key) {
	return redis.del(API_KEY)
}

module.exports = {
	isValid: isValid,
	login: login,
	logout: logout
}