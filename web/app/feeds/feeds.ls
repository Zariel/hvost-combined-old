app = angular.module 'recess.feeds'
app.controller 'FeedController', [
	'$scope'
	'$route'
	'Feed'
	($scope, $route, Feed) ->
		$scope.feeds = $route.current.locals.feed
		$scope.$watch $route.current.params.id, (id) ->
			$scope.feeds = Feed.query { id }
]

app.factory 'Feed', [
	'$resource'
	($resource) ->
		$resource '/api/feed/:id', {
			id: '@id'
		}
]

app.factory 'FeedResolver', [
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

app.directive 'FeedView', {
	
}