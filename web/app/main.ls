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
			redirectTo: '/feeds/unread'
		}

		$locationProvider.html5Mode true .hashPrefix '!'
]