app = angular.module 'indexdb', []

app.factory 'indexdb', [
	'$window'
	'$q'
	'$rootScope'

	($window, $q, $rootScope) ->
		const idb = $window.indexedDB

		apply = (f) -> $rootScope.$apply f

		{
			open: (name, version = 1, onUpgrade) ->
				defer = $q.defer!

				req = idb.open name, version

				req.onupgradeneeded = onUpgrade or -> console.log 'WARN: onupgradeneeded without upgrade function.'

				req.onsuccess = (event) ->
					apply ->
						db = event.target.result
						defer.resolve db, event

				failed = false
				req.onerror = (event) ->
					console.log "ERR: db error = " + event.target.errorCode
					return if failed
					failed := true

					apply ->
						defer.reject event

				return defer.promise

			get: (db, storeName, key) ->
				defer = $q.defer!

				transaction = db.transaction [ storeName ]
				store = transaction.objectStore storeName
				req = store.get key

				req.onsuccess = (event) ->
					apply ->
						result = event.target.result
						if result is void
							defer.reject event
						else
							defer.resolve result, event

				req.onerror = (event) ->
					apply -> defer.reject event

				defer.promise

			add: (db, storeName, value, key) ->
				defer = $q.defer!

				transaction = db.transaction [ storeName ], 'readwrite'
				store = transaction.objectStore storeName
				req = store.add value

				transaction.oncomplete = (event) ->
					apply ->
						defer.resolve event.target.result, event

				transaction.onerror = (event) ->
					apply ->
						defer.reject event
		}
]
