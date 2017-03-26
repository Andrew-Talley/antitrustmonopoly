var app = angular.module('menuApp', []);
app.controller('menuController', function ($scope, $http) {
    var allData = $http.get('game-types.json').success(function (response) {
        $scope.allOptions = JSON.parse(response);
    })
})