app = angular.module 'recess', [
	'ngResource'

	'recess.feeds'
	'recess.controls'
	'indexdb'
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