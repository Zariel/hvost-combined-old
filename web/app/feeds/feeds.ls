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

app.directive 'feedlist', [
	->
		restrict: 'E'
		controller: ["$scope", ($scope) ->
			selected = undefined

			this.click = (id, controller) ->
				if selected and selected is controller
					controller.unselect!
					selected := void
				else
					selected.unselect! if selected
					controller.select!
					selected := controller

		]

]

app.directive 'feeditem', [
	->
		{
			require: '^feedlist'
			restrict: 'E'
			transclude: true
			replace: true
			template: """<section class="feed-item well"><div ng-transclude></div></section>"""
			controller: ["$scope", ($scope) ->
			]
			link: (scope, element, attrs, controller) ->
				feedId = scope.feed.id

				element.bind 'click', ->
					controller.click feedId, scope

				scope.select = ->
					element.addClass 'feed-selected'

				scope.unselect = ->
					element.removeClass 'feed-selected'

		}
]