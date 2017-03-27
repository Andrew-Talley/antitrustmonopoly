var app = angular.module('menuApp', []);
app.controller('menuController', function ($scope, $http) {
    $scope.allOptions = [];
    $scope.groups = [];
    $http.get('https://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
        $scope.allOptions = response;
    });
    $http.get('https://www.antitrustmonopoly.com/app/scripts/monopoly-names.json').success(function (response) {
        $scope.groups = response;
    });
    $scope.addProp = function (index) {
        $scope.groups[index].properties.push({ "name": "", "value": 0 });
    }
    $scope.addPropGroup = function () {
        $scope.groups.push({
            "bgColor": "#FF0000",
            "properties": [
                {
                    "name": "",
                    "value": 0
                }
            ]
        })
    }
    $scope.leftClicked = function (event) {
        $(event.target).parent().children('input').click();
    }
    $scope.menuOptionClick = function (event, option) {
        if (option.text == 'Monopoly (post-2008)')
    }
});