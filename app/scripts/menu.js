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
    $scope.setCompanyOrder = function (entity) {
        var cur = $scope.currentPlayer;
        for (var i = 0; i < entity.directOwnership.length; i++) {
            var subEnt = entity.directOwnership[i];
            if (!subEnt.isProperty) {
                if (subEnt.level <= entity.level) {
                    subEnt.level = entity.level + 1;
                    $scope.players[cur].maxLevel = Math.max($scope.players[cur].maxLevel, subEnt.level);
                }
                $scope.setCompanyOrder(entity.directOwnership[i]);
            }
        }
    }
    $scope.setAllCompaniesOrder = function () {
        var player = $scope.players[$scope.currentPlayer];
        player.maxLevel = 1;
        player.directOwnership.forEach(function(comp) {
            comp.level = 1;
        });
        for (var i = 0; i < player.directOwnership.length; i++) {
            $scope.setCompanyOrder(player.directOwnership[i]);
            $scope.players[$scope.currentPlayer].maxLevel = Math.max(player.maxLevel, player.directOwnership[i].level);
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
        $scope.players[curPl].directOwnership.push(newComp);
        $scope.players[curPl].companyNumber += 1;
        console.log($scope.players[curPl]);
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
        $(event.target).addClass('active-tooltip');
    }
    $scope.activateProperty = function (event) {
        $(event.target).parent().addClass('active-tooltip');
    }
    $scope.deactivateTooltip = function (event) {
        var tar = $(event.target);
        if (!tar.hasClass('active-tooltip') && !tar.is('.active-tooltip *')) {
            var active = $('.active-tooltip');
            active.removeClass('active-tooltip').find('.active').removeClass('active');
            active.find('.first').addClass('active');
        }    
    }
    $scope.backTooltip = function (event) {
        var parent = $(event.target).parent().removeClass('active');
        parent.parent().children('.first').addClass('active');
    }
    $scope.severOwners = function (event) {
        var parent = $(event.target).parent().removeClass('active');
        parent.parent().children('.sever').addClass('active');
    }
    $scope.addOwners = function (event) {
        var parent = $(event.target).parent().removeClass('active');
        parent.parent().children('.add').addClass('active');
    }
    $scope.sever = function (owner, subsidiary) {
        var index = owner.directOwnership.indexOf(subsidiary);
        if (index != -1) owner.directOwnership.splice(index, 1);
        console.log(owner.directOwnership);
        $scope.setAllCompaniesOrder();
    }
    $scope.addOwner = function (newOwner, newSubsidiary) {
        if (newOwner.directOwnership.indexOf(newSubsidiary) == -1) {
            newOwner.directOwnership.push(newSubsidiary);
            $scope.setAllCompaniesOrder();
        }
    }


    $scope.iterateOver = function (num) {
        return new Array(num);
    }
});

function updateCanvas() {
    var allHolders = $('.property-holder');
}

function explorePath(item, company) {
    if (item.isProperty) return true;
    if (item === company) return false;
    for (var i = 0; i < item.directOwnership.length; i++) {
        if (!explorePath(item.directOwnership[i])) return false;
    }
    return true;
}

/**
 * Recursively check for one company owning a second
 * @param {JSON} testCompany - The company to check
 * @param {JSON} keyCompany - The company to check is included
 */
function subsidiariesInclude(testCompany, keyCompany) {
    if (testCompany === keyCompany) return true;
    if (testCompany.isProperty || testCompany.directOwnership.length == 0) return false;
    return testCompany.directOwnership.some(function(subsidiary) {
        return subsidiariesInclude(subsidiary, keyCompany);
    });
}

menuApp.filter('doesNotOwn', function () {
    return function (companies, input) {
        return companies.filter(function (company) {
            return !subsidiariesInclude(input, company);
        });
    };
});

menuApp.filter('notDirectlyOwnedBy', function () {
    return function (companies, keyCompany) {
        return companies.filter(function (owner) {
            return !owner.directOwnership.some(function (subsidiary) {
                return subsidiary === keyCompany;
            })
        });
    }
})

menuApp.filter('directlyOwns', function () {
    return function (companies, keyCompany) {
        return companies.filter(function (owner) {
            return owner.directOwnership.some(function (subsidiary) {
                return subsidiary === keyCompany;
            })
        });
    }
});