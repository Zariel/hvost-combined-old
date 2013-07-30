/*
 * Import google reader subscriptions.xml
 */

require! xml2js
require! Q
require! fs
require! path
feeds = require '../server/feeds'

config =
	host: 'localhost'
	user: 'recess'
	password: 'horse'
	database: 'recess'

db = (require '../server/db') config

cbQ = (defer) ->
	(err, res) ->
		return defer.reject err if err

		defer.resolve res

open = (file) ->
	defer = Q.defer!

	fs.readFile file, cbQ defer

	defer.promise

parseXML = (buf) ->
	defer = Q.defer!

	xml2js.parseString buf, cbQ defer

	defer.promise

processXML = (xml) ->
	# I want to generate a list of groups with a list of channels inside.
	root = xml.opml.body[0].outline

	defaultGroup = processFeed root, 0

	p = root
	.filter (x) -> x.outline
	.map (x) ->
		group = x.$.title
		db.insertAndGetGroup group .then (id) ->
			processFeed x.outline, id

	Q.all p .then (list) ->
		defaultGroup.concat.apply defaultGroup, list

processFeed = (root, groupId) ->
	root
	.filter (x) -> x.$.type is 'rss'
	.map (node) ->
		{
			url: node.$.xmlUrl
			title: node.$.title
			group: groupId
		}

insertChannel = (url, title, groupId) ->
	(feeds.add db, url, groupId, title)

insert = (list) ->
	Q.all (list.map (x) -> insertChannel x.url, x.title, x.group)

do run = ->
	file = process.argv[2] |> path.normalize

	return console.log 'File is not subscriptions.xml' if (path.basename file) is not 'subscriptions.xml'

	open file .then parseXML .then processXML .then insert .then (res) -> console.log res .catch (err) -> console.log err.stack
