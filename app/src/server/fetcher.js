(function(){
  var Q, request, fetchFeed, start;
  Q = require('Q');
  request = require('request');
  fetchFeed = function(url){
    var defer;
    defer = Q.defer();
    request(url, function(err, res, body){
      if (err || res.statusCode >= 400) {
        return defer.reject(res);
      }
      return defer.resolve(body);
    });
    return defer.promise;
  };
  start = function(db){};
  module.exports = {
    start: start
  };
}).call(this);
