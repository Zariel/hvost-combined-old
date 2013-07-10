app = angular.module 'recess.feeds', []

app.config [
	'$routeProvider'

	($routeProvider) ->
		$routeProvider.when '/feed/:id', {
			controller: 'FeedController'
			templateUrl: '/partials/feeds/feeds.html'
			resolve: {
				feed: 'FeedResolver'
			}
			reloadOnSearch: false
		}
]
