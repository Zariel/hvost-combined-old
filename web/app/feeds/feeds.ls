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

app.directive 'feedlist', [
	->
		restrict: 'E'
		controller: ["$scope", "$location", "$anchorScroll", ($scope, $location, $anchorScroll) ->

			selected = void
			currentIndex = -1
			items = {}

			this.click = (id, index, controller) ->
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

			this.addItem = (id, scope) ->
				items[id] = scope

			this.next = ->
				console.log items[currentIndex + 1]
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
			controller: ["$scope", "Feed", ($scope, Feed) ->
				$scope.markRead = (feed) ->
					a = new Feed { id: feed.id }
					a.$read!
					feed.read = true
			]

			link: (scope, element, attrs, controller) ->
				feed = scope.feed

				element.bind 'click', ->
					scope.$apply ->
						controller.click feed.id, scope.$index, scope
						scope.markRead feed if not feed.read

				scope.select = ->
					element.addClass 'feed-selected'

				scope.unselect = ->
					element.removeClass 'feed-selected'

				#if "f#feedId" is scope.hash
				#	click!
		}
]

app.filter 'unread', [
	->
		(list) ->
			list?filter -> !it.read
]