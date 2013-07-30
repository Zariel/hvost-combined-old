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

var isValid = function(key) {
	return redis.get(API_KEY).then(function(res) {
		if(!res || res !== key) {
			return false
		}

		redis.expire(API_KEY, EXPIRE_TIME).catch(function(err) {
			console.log(err.stack)
		})

		return true
	})
}

var login = function(name, passw) {
	return db.getUser(name).then(function(res) {
		if(res.length !== 1) {
			throw new Error("No user registered")
		}

		var details = res[0]
		if(authLib.isPasswordValid(passw, details.password)) {
			var key = createApiKey(name, details.password)
			// could maybe return this early but would lead to race conditions
			return redis.set(API_KEY, key).then(function() {
				return redis.expire(API_KEY, EXPIRE_TIME).then(function() {
					return key
				})
			})
		} else {
			throw new Error("Password is invalid")
		}
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