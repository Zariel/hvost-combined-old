(function(){
  var app;
  app = angular.module('recess.controls', []);
}).call(this);
(function(){
  var app;
  app = angular.module('recess.controls');
  app.controller('ControlsController', [
    '$scope', '$http', function($scope, $http){
      var x$;
      $scope.addFeed = function(url){
        var x$;
        x$ = $http.post('/api/feed/add', {
          url: url
        });
        x$.then(function(res){
          var data, status, headers;
          data = res.data, status = res.status, headers = res.headers;
          return alert(status);
        });
        return x$;
      };
      x$ = $http.get('/api/channels');
      x$.success(function(data, status, headers){
        return $scope.channels = data;
      });
    }
  ]);
  app.directive('LoadSpinner', {
    restrict: 'A',
    scope: {},
    controller: ['$scope', '$http', function($scope, $http){}],
    link: function(scope, element, attrs){}
  });
}).call(this);
(function(){
  var app;
  app = angular.module('recess.feeds', []);
  app.config([
    '$routeProvider', function($routeProvider){
      return $routeProvider.when('/feed/:id', {
        controller: 'FeedController',
        templateUrl: '/partials/feeds/feeds.html',
        resolve: {
          feed: 'FeedResolver'
        }
      });
    }
  ]);
}).call(this);
(function(){
  var app;
  app = angular.module('recess.feeds');
  app.controller('FeedController', [
    '$scope', '$route', 'Feed', function($scope, $route, Feed){
      $scope.feeds = $route.current.locals.feed;
      return $scope.$watch($route.current.params.id, function(id){
        return $scope.feeds = Feed.query({
          id: id
        });
      });
    }
  ]);
  app.factory('Feed', [
    '$resource', function($resource){
      return $resource('/api/feed/:id', {
        id: '@id'
      });
    }
  ]);
  app.factory('FeedResolver', [
    '$q', '$route', 'Feed', function($q, $route, Feed){
      var defer, id;
      defer = $q.defer();
      id = $route.current.params.id;
      Feed.query({
        id: id
      }, function(feed){
        return defer.resolve(feed);
      }, function(){
        return defer.reject();
      });
      return defer.promise;
    }
  ]);
  app.directive('FeedView', {});
}).call(this);
(function(){
  var app;
  app = angular.module('indexdb', []);
  app.factory('indexdb', [
    '$window', '$q', '$rootScope', function($window, $q, $rootScope){
      var idb, apply;
      idb = $window.indexedDB;
      apply = function(f){
        return $rootScope.$apply(f);
      };
      return {
        open: function(name, version, onUpgrade){
          var defer, req, failed;
          version == null && (version = 1);
          defer = $q.defer();
          req = idb.open(name, version);
          req.onupgradeneeded = onUpgrade || function(){
            return console.log('WARN: onupgradeneeded without upgrade function.');
          };
          req.onsuccess = function(event){
            return apply(function(){
              var db;
              db = event.target.result;
              return defer.resolve(db, event);
            });
          };
          failed = false;
          req.onerror = function(event){
            console.log("ERR: db error = " + event.target.errorCode);
            if (failed) {
              return;
            }
            failed = true;
            return apply(function(){
              return defer.reject(event);
            });
          };
          return defer.promise;
        },
        get: function(db, storeName, key){
          var defer, transaction, store, req;
          defer = $q.defer();
          transaction = db.transaction([storeName]);
          store = transaction.objectStore(storeName);
          req = store.get(key);
          req.onsuccess = function(event){
            return apply(function(){
              var result;
              result = event.target.result;
              if (result === void 8) {
                return defer.reject(event);
              } else {
                return defer.resolve(result, event);
              }
            });
          };
          req.onerror = function(event){
            return apply(function(){
              return defer.reject(event);
            });
          };
          return defer.promise;
        },
        add: function(db, storeName, value, key){
          var defer, transaction, store, req;
          defer = $q.defer();
          transaction = db.transaction([storeName], 'readwrite');
          store = transaction.objectStore(storeName);
          req = store.add(value);
          transaction.oncomplete = function(event){
            return apply(function(){
              return defer.resolve(event.target.result, event);
            });
          };
          return transaction.onerror = function(event){
            return apply(function(){
              return defer.reject(event);
            });
          };
        }
      };
    }
  ]);
}).call(this);
(function(){
  var app;
  app = angular.module('recess', ['ngResource', 'recess.feeds', 'recess.controls', 'indexdb']);
  app.config([
    '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
      $routeProvider.when('/', {
        redirectTo: '/feeds/unread'
      });
      return $locationProvider.html5Mode(true).hashPrefix('!');
    }
  ]);
}).call(this);
