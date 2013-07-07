global <<< require 'prelude-ls'

web = require './server/web'
fetcher = require './server/fetcher'
db = require './server/db'

require! cluster
require! os

nCpus = os.cpus!length

db = (require './server/db') {
	host: 'localhost'
	user: 'recess'
	password: 'horse'
	database: 'recess'
}

if cluster.isMaster
	fetcher.start db

	for i from 1 to nCpus
		worker = cluster.fork!

		worker.on 'error', (err) ->
			console.log err
else
	web.server db