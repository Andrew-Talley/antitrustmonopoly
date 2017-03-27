var app = angular.module('menuApp', []);
app.controller('menuController', function ($scope, $http) {
    $http.get('https://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
        $scope.allOptions = response;
    });
    $http.get('https://www.antitrustmonopoly.com/app/scripts/monopoly-names.json').success(function (response) {
        $scope.groups = response;
    })
});