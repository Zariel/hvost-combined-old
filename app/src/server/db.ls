require! mysql
require! Q

db = (config) ->
	pool = mysql.createPool config

	getConnection = ~>
		defer = Q.defer!

		pool.getConnection (err, con) ->
			return defer.reject err if err

			defer.resolve con

		defer.promise

	this.query = query = ~>
		defer = Q.defer!

		args = Array.prototype.slice.call arguments
		args.push (err, rows) ->
			return defer.reject err if err

			defer.resolve rows

		getConnection!then (con) ->
			con.query.apply con, args
			con.close!

		defer.promise

	this

module.exports = db