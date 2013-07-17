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
	DB.prototype.query = function(sql, vals) {
		var pool = this.pool
		return this.getConnection().then(function(conn) {
			var defer = Q.defer()

			conn.query(sql, vals, function(err, rows) {
				// For some reason the program hangs if I dont destroy the connections, which
				// kind of defeats the purpous.
				conn.destroy()

				if(err) {
					return defer.reject(err)
				}

				defer.resolve(rows)
			})

			return defer.promise
		})
	}

	DB.prototype.getChannels = function() {
		//return this.query("SELECT Channels.* FROM Channels;")
		return this.query("SELECT Channels.*, COUNT(Items.item_id) as unread_count FROM Channels LEFT JOIN Items USING (channel_id) WHERE Items.read = 0 GROUP BY Channels.channel_id");
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

	DB.prototype.getGroupId = function(name) {
		return this.query("SELECT group_id FROM Groups WHERE name = ?", [name])
	}

	DB.prototype.insertAndGetGroup = function(name) {
		var this$ = this
		var defer = Q.defer()

		this$.query("INSERT INTO Groups SET name = ?", [name]).then(function(res) {
			defer.resolve(res.insertId)
		}, function(err) {
			if(err.code !== 'ER_DUP_ENTRY') {
				return defer.reject(err)
			}

			this$.query("SELECT group_id FROM Groups WHERE name = ?", [name]).then(function(res) {
				defer.resolve(res[0].group_id)
			}, function(err) {
				defer.reject(err)
			})
		}).catch(function(err) {
			console.log(err.stack)
		})

		return defer.promise
	}

	return DB
})()

module.exports = function(config) {
	var pool = mysql.createPool(config)

	var db = new DB(pool)

	return db
}
