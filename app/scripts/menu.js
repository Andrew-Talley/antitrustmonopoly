var menuApp = angular.module('app', []);
menuApp.controller('appController', function ($scope, $http) {
    $scope.allOptions = [];
    $scope.groups = [];
    $scope.settings = {};
    $http.get('https://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
        $scope.allOptions = response;
    });
    $http.get('https://www.antitrustmonopoly.com/app/scripts/monopoly.json').success(function (response) {
        $scope.groups = response.propertyGroups;
        $scope.settings = response.gameSettings;
    });
    $scope.addProp = function (index) {
        $scope.groups[index].properties.push({ "name": "", "value": 0 });
    }
    $scope.addPropGroup = function () {
        $scope.groups.push({
            "style": {
                "background-color": "#888"
            },
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
        var url = "";
        if (option.text == 'Monopoly (post-2008)') {
            url = "https://www.antitrustmonopoly.com/app/scripts/monopoly.json";
        } else if (option.text == "Classic Monopoly (pre-2008)") {
            url = "https://www.antitrustmonopoly.com/app/scripts/classic-monopoly.json";
        } else {

        }
        $http.get(url).success(function (response) {
            $scope.groups = response.propertyGroups;
            $scope.settings = response.gameSettings;
        });
    }
});