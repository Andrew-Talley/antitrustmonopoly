var menuApp = angular.module('app', []);
menuApp.controller('appController', function ($scope, $http) {
    $scope.allOptions = [];
    $scope.groups = [];
    $scope.settings = {};
    $scope.currentPlayer = 0;
    $scope.players = [];
    $http.get('https://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
        $scope.allOptions = response;
    });
    $http.get('https://www.antitrustmonopoly.com/app/scripts/monopoly.json').success(function (response) {
        $scope.groups = response.propertyGroups;
        groups = response.propertyGroups;
        $scope.settings = response.gameSettings;
        $scope.players = response.players;
        players = response.players;
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
            $scope.players = response.players;
        });
    }

    /** App Methods **/
    $scope.setEntityOrder = function (index) {
        var cur = $scope.currentPlayer;
        var player = $scope.players[cur];
        var ent = player.entities[index];
        for (var i = 0; i < ent.entities.length; i++) {
            var subEnt = player.entities[ent.entities[i]];
            if (!subEnt.isProperty) {
                if (subEnt.level <= ent.level) {
                    subEnt.level = ent.level + 1;
                    player.maxLevel = Math.max(player.maxLevel, x.level + 1);
                }
                $scope.setEntityOrder(ent.entities[i]);
            }
        }
    }
    $scope.setCompanyOrder = function () {
        for (var i = 0; i < $scope.players[$scope.currentPlayer].directOwnership.length; i++) {
            $scope.setEntityOrder($scope.players[$scope.currentPlayer].directOwnership[i]);
        }
    }
    $scope.setMonopolies = function () {
        var companies = $scope.players[$scope.currentPlayer].companies;
        var monopolies = $scope.players[$scope.currentPlayer].monopolies;
        for (var i in companies) {
            if (groups[companies[i].companies[0].groupInd].properties.length == companies[i].companies.length) {
                groups[companies[i].companies[0].groupInd].isReady = true;
                console.log($scope.players[$scope.currentPlayer].companies[i])
            }
        }
        for (var j in monopolies) {
            console.log(j);
            if (groups[monopolies[j].companies[0].groupInd].properties.length != monopolies[j].companies.length) {
                $scope.players[$scope.currentPlayer].companies[j] = monopolies[j];
                delete $scope.players[$scope.currentPlayer].monopolies[j];
            }
        }
    }
    $scope.addMonopolyGroup = function (group) {
        if (groups[companies[group.groupInd].companies[0].groupInd].properties.length == companies[i].companies.length) {
            $scope.players[$scope.currentPlayer].monopolies[group.groupInd] = 
            groups[companies[i].companies[0].groupInd].isReady = true;
            console.log($scope.players[$scope.currentPlayer].companies[i])
        }
    }
    $scope.addCompanyToPlayer = function () {
        var newComp = {
            'name': 'Holding Company',
            'level': 1,
            'entities': [],
            'isProperty': false
        }
        $scope.players[$scope.currentPlayer].entities.push(newComp);
    }
    $scope.addPropertyToPlayer = function (property) {
        var groupInd = 0;
        var propInd = 0;
        var done = false;
        for (var i = 0; i < $scope.groups.length && !done; i++) {
            for (var j = 0; j < $scope.groups[i].properties.length; j++) {
                if (property === $scope.groups[i].properties[j]) {
                    groupInd = i;
                    propInd = j;
                    done = true;
                    break;
                }
            }
        }
        var newProp = {
            'groupInd': groupInd,
            'propInd': propInd,
            'isProperty': true
        }
        if (typeof $scope.players[$scope.currentPlayer].companies[groupInd] === 'undefined') {
            $scope.players[$scope.currentPlayer].companies[groupInd] = { 'order': groupInd, companies: [] };
        }
        $scope.players[$scope.currentPlayer].companies[groupInd].companies.push(newProp);
        $scope.groups[groupInd].properties[propInd].owned = true;

        $scope.setMonopolies();
    }
    $scope.nextPlayer = function () {
        $scope.currentPlayer += 1;
        if ($scope.currentPlayer >= $scope.players.length) $scope.currentPlayer = 0;
    }
    $scope.startGame = function () {
        $scope.groups = $scope.groupInd;
    }
});