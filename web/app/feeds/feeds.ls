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
		$resource '/api/feed/:id/:action', {
			id: '@id'
		}, {
			read:
				method: 'GET'
				params:
					action: 'read'
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

app.factory 'FeedList', [
	"$location"

	($location) ->
		selected = undefined
		currentIndex = -1

		{
			click: (id, index, controller) ->
				var hash

				if selected and selected is controller
					controller.unselect!
					selected := void
					hash = ''
				else
					selected.unselect! if selected
					controller.select!
					selected := controller
					hash = "f#id"

				$location.hash hash .replace!

			next: (a) ->

		}
]

app.directive 'feedlist', [
	->
		restrict: 'E'
		controller: ["$scope", "$location", "$anchorScroll", ($scope, $location, $anchorScroll) ->

			selected = undefined
			currentIndex = -1

			this.click = (id, index, controller) ->
		]

]

app.directive 'feeditem', [
	->
		{
			require: '^feedlist'
			restrict: 'E'
			transclude: true
			replace: true
			template: """<section class="feed-item well" id = "f{{feed.id}}"><div ng-transclude></div></section>"""
			controller: ["$scope", "Feed", "FeedList", ($scope, Feed, FeedList) ->
				feedId = $scope.feed.id

				$scope.click = ->
					FeedList.click feedId, $scope.$index, $scope
					$scope.markRead $scope.feed if not $scope.feed.read

				$scope.markRead = (feed) ->
					a = new Feed { id: feedId }
					a.$read!
					feed.read = true
			]

			link: (scope, element, attrs, controller) ->
				element.bind 'click', ->
					scope.$apply -> scope.click!

				scope.select = ->
					element.addClass 'feed-selected'

				scope.unselect = ->
					element.removeClass 'feed-selected'

				#if "f#feedId" is scope.hash
				#	click!
		}
]