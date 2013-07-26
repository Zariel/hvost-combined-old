app = angular.module 'recess.feeds', []

app.config [
	'$routeProvider'

	($routeProvider) ->
		$routeProvider.when '/feed/:id', {
			controller: 'FeedController'
			templateUrl: '/partials/feeds/feeds.html'
			resolve: {
				feed: [
					'$q'
					'$route'
					'Feed'

					($q, $route, Feed) ->
						defer = $q.defer!

						id = $route.current.params.id

						Feed.query { id }, ((feed) ->
							defer.resolve feed
						), -> defer.reject!

						defer.promise
				]
			}
			reloadOnSearch: false
		}
]
