var app = angular.module('menuApp', []);
app.controller('menuController', function ($scope, $http) {
    var allData = $http.get('http://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
        $scope.allOptions = response;
    })
})