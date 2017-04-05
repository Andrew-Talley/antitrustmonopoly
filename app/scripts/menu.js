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
    $scope.setCompanyOrder = function (index) {
        var cur = $scope.currentPlayer;
        var player = $scope.players[cur];
        var ent = player.companies[parseInt(index)];
        for (var i = 0; i < ent.directOwnership.length; i++) {
            var subEnt = player.companies[ent.directOwnership[i]];
            console.log(subEnt);
            if (!subEnt.isProperty) {
                if (subEnt.level <= ent.level) {
                    var x = $scope.players[cur].companies[index].level = ent.level + 1;
                    $scope.players[cur].maxLevel = Math.max(player.maxLevel, x);
                    console.log(x);
                }
                $scope.setCompanyOrder(ent.directOwnership[i]);
            }
        }
    }
    $scope.setAllCompaniesOrder = function () {
        var player = $scope.players[$scope.currentPlayer];
        for (var i = 0; i < player.directOwnership.length; i++) {
            var ind = player.directOwnership[i];
            $scope.setCompanyOrder(ind);
            $scope.players[$scope.currentPlayer].maxLevel = Math.max(player.maxLevel, player.companies[ind].level);
        }
        console.log($scope.players[$scope.currentPlayer]);
    }
    $scope.setMonopolies = function () {
        var properties = $scope.players[$scope.currentPlayer].properties;
        var monopolies = $scope.players[$scope.currentPlayer].monopolies;
        for (var i in properties) {
            if (groups[properties[i].properties[0].groupInd].properties.length == properties[i].properties.length) {
                groups[properties[i].properties[0].groupInd].isReady = true;
            }
        }
        for (var j in monopolies) {
            if (groups[monopolies[j].properties[0].groupInd].properties.length != monopolies[j].properties.length) {
                $scope.players[$scope.currentPlayer].properties[j] = monopolies[j];
                delete $scope.players[$scope.currentPlayer].monopolies[j];
            }
        }
    }
    $scope.addMonopolyGroup = function (group) {
        if ($scope.groups[group.order].isReady) {
            $scope.players[$scope.currentPlayer].monopolies[group.order] = group;
            delete $scope.players[$scope.currentPlayer].properties[group.order];
        }
    }
    $scope.sellProperty = function (property) {
        $scope.monopolies;
    }
    $scope.addCompanyToPlayer = function () {
        var curPl = $scope.currentPlayer;
        var newComp = {
            'name': 'C' + $scope.players[curPl].companyNumber,
            'level': 1,
            'directOwnership': [],
            'isProperty': false
        };
        $scope.players[curPl].companies.push(newComp);
        $scope.players[curPl].directOwnership.push($scope.players[curPl].companies.length - 1);
        $scope.players[curPl].companyNumber += 1;
        $scope.setAllCompaniesOrder();
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
        if (typeof $scope.players[$scope.currentPlayer].properties[groupInd] === 'undefined') {
            $scope.players[$scope.currentPlayer].properties[groupInd] = { 'order': groupInd, properties: [] };
        }
        $scope.players[$scope.currentPlayer].properties[groupInd].properties.push(newProp);
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
    $scope.activateCompany = function (event) {
        $(event.target).addClass('active-company');
    }
    $scope.deactivateCompany = function (event) {
        var tar = $(event.target);
        if (!tar.hasClass('company') && !tar.is('.company *')) {
            $('.active-company').removeClass('active-company');
        }    
    }
    $scope.sever = function (event) {
        var parent = $(event.target).parent().removeClass('active');
        parent.parent().children('.choose').addClass('active');
    }
    $scope.iterateOver = function (num) {
        return new Array(num);
    }
});

function updateCanvas() {
    var allHolders = $('.property-holder');
}

function explorePath(index, element, companies) {
    
}

menuApp.filter('descendentsInclude', function () {
    return function (items, element, companies) {
        var out = [];
        angular.forEach(items, function (item, element, companies) {
            out.push(explorePath(item, element, companies));
        });
    }
})