var web = require('./server/web')
var fetcher = require('./server/fetcher')
var db = require('./server/db')
var cluster = require('cluster')
var os = require('os')

var nCpus = os.cpus().length
var config = {
	host: 'localhost',
	user: 'recess',
	password: 'horse',
	database: 'recess'
}

var db = require('./server/db')(config)

if (cluster.isMaster) {
	fetcher.start(db);

	for (var i = 1; i < nCpus; i++) {
		worker = cluster.fork()
		worker.on('error', function(err) {
			console.log(err)
		})
	}
} else {
	web.server(db)
}