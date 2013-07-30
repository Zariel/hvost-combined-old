app = angular.module 'recess', [
	'ngResource'

	'indexdb'
	'infinite-scroll'

	'recess.feeds'
	'recess.controls'
]

app.config [
	'$routeProvider'
	'$locationProvider'

	($routeProvider, $locationProvider) ->
		$routeProvider.when '/', {
			controller: 'FeedController'
			templateUrl: '/partials/feeds/feeds.html'
			resolve: {
				feed: [
					'$q'
					'Feed'

					($q, Feed) ->
						defer = $q.defer!

						Feed.query { from: 0, count: 25 }, ((feed) ->
							defer.resolve feed
						), -> defer.reject!

						defer.promise
				]
			}
			reloadOnSearch: false
		}

		$locationProvider.html5Mode true .hashPrefix '!'
]

app.factory 'PageTitle', [
	'$rootScope'

	($rootScope) ->
		{
			setTitle: (title) ->
				$rootScope.pageTitle = title
		}
]