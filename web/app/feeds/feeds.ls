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
		controller: ["$scope", "$location", "$window", "Feed", ($scope, $location, $window, Feed) ->

			$window.addEventListener 'keyup', (event, key) ->
				key = event.keyCode
				if key is 74
					$scope.$apply next
				else if key is 75
					$scope.$apply prev

			$scope.markRead = (feed) ->
				a = new Feed { id: feed.id }
				a.$read!
				feed.read = true

			selected = void
			currentIndex = -1
			items = {}

			/*
			 * I could use events and broadcast them to each item but instead of
			 * having every item check that it should be selected I can directly call them.
			 * This causes a problem with the 'next' and 'prev' which would be simple using
			 * events. Also it means that 'clicking' must do much more than just select something.
			 */
			click = this.click = (feed, index, controller) ->
				var hash
				id = feed.id

				if selected and selected is controller
					controller.unselect!
					selected := void
					hash = ''
				else
					$scope.markRead feed if not feed.read
					selected.unselect! if selected
					controller.select!
					selected := controller
					hash = "f#id"

				console.log hash

				$location.hash hash .replace!

			this.addItem = (feed, index, scope) ->
				items[index] = { scope, feed, index }

			next = this.next = ->
				current = currentIndex
				currentIndex := items.length if ++currentIndex >= items.length
				return if current is currentIndex

				{scope, feed} = items[currentIndex]
				click feed, currentIndex, scope

			prev = this.prev = ->
				current = currentIndex
				currentIndex := 0 if --currentIndex < 0
				return if current is currentIndex

				{scope, feed} = items[currentIndex]
				click feed, currentIndex, scope
		]
		link: (scope, element, attrs) ->

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
			]

			link: (scope, element, attrs, controller) ->
				feed = scope.feed

				controller.addItem feed, scope.$index, scope

				element.bind 'click', ->
					scope.$apply ->
						controller.click feed, scope.$index, scope

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