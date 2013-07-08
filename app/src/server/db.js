var mysql = require('mysql')
var Q = require('Q')

var db = function(config) {
  var pool = mysql.createPool(config)

  var getConnection = function() {}
	var defer = Q.defer()

	pool.getConnection(function(err, con) {
	  if (err) {
		return defer.reject(err)
	  }

	  return defer.resolve(con)
	})

	return defer.promise;
  }

  this.query = query = function() {
	var defer = Q.defer()
	var args = Array.prototype.slice.call(arguments)
	args.push(function(err, rows) {
	  if (err) {
		return defer.reject(err)
	  }

	  return defer.resolve(rows)
	})

	getConnection().then(function(con){
	  con.query.apply(con, args);
	  return con.close()
	})

	return defer.promise
  }

  return this
}

module.exports = db
