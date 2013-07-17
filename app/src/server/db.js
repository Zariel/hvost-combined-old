var mysql = require('mysql')
var Q = require('Q')

/*
 * Todo:
 * Add cache, I love redis
 */

var DB = (function() {
	function DB(pool) {
		this.pool = pool

		return this
	}

	DB.prototype.getConnection = function() {
		var defer = Q.defer()

		this.pool.getConnection(function(err, conn) {
			if(err) {
				return defer.reject(err)
			}

			defer.resolve(conn)
		})

		return defer.promise
	}

	// This passes arguments directly to mysql.connection.query
	DB.prototype.query = function() {
		var defer = Q.defer()

		var args = Array.prototype.slice.call(arguments)
		args.push(function(err, rows) {
			if (err) {
				console.log(err)
				return defer.reject(err)
			}

			return defer.resolve(rows)
		})

		this.getConnection().then(function(con){
			con.query.apply(con, args);
			return con.end()
		})

		return defer.promise
	}

	DB.prototype.getChannels = function() {
		return this.query("SELECT * FROM Channels;")
	}

	DB.prototype.getFeed = function(id) {
		return this.query("SELECT * FROM Items WHERE channel_id = ? AND `read` = 0 ORDER BY published", [id])
	}

	DB.prototype.markRead = function(id) {
		return this.query("UPDATE Items SET `read` = 1 WHERE item_id = ?", [id])
	}

	DB.prototype.getFeedItem = function(id) {
		return this.query("SELECT * FROM Items WHERE item_id = ?", [id])
	}

	return DB
})()

module.exports = function(config) {
	var pool = mysql.createPool(config)

	var db = new DB(pool)

	return db
}
