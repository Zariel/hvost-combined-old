app = angular.module 'recess.controls'

app.controller 'ControlsController', [
	'$scope'
	'$http'

	!($scope, $http) ->
		$scope.addFeed = (url) ->
			$http.post '/api/feed/add', { url }
				..then ({data, status, headers}:res) ->
					alert status

		$http.get '/api/channels'
			..success (data, status, headers) ->
				$scope.channels = data
]

app.directive 'LoadSpinner', {
	restrict: 'A'
	scope: {}
	controller: [
		'$scope'
		'$http'

		!($scope, $http) ->
	]
	link: !(scope, element, attrs) ->
}