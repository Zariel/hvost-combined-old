var crypto = require("crypto")

var createSalt = module.exports.createSalt = function() {
	var len = 16
	return crypto.randomBytes(len * 2).slice(0, len).toString("hex")
}

var hash = module.exports.hash = function(salt, str) {
	var digest = crypto.createHash("sha512")

	digest.update(salt)
	digest.update(str)

	var res = ""

	for(var i = 0; i < 1024; i++) {
		res = digest.digest("hex")
		digest = crypto.createHash("sha512")
		digest.update(res)
	}

	return res
}

var createPassword = module.exports.createPassword = function(passw) {
	var salt = createSalt()
	var hashed = hash(salt, passw)

	return salt + ":" + hashed
}

var isPasswordValid = module.exports.isPasswordValid = function(passw, stored) {
	var s = stored.split(":")

	var salt = s[0]
	var hashed = s[1]

	return hashed === hash(salt, passw)
}