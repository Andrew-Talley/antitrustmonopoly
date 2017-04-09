/*
 * TODO:
 * Adding a monopoly group to a player causes an error. It looks like it comes from the $last element's call to $scope.updateCanvas()
 * Start using popper.js framework so the popup things don't look like shit and so we don't have a div with a class that's barely ironically called "pointy"?
 */

var app = angular.module('app', []);
app.controller('appController', function ($scope, $http) {
    $scope.allOptions = [];
    $scope.groups = [];
    $scope.settings = {};
    $scope.currentPlayer = {};
    $scope.players = [];
    $http.get('http://www.antitrustmonopoly.com/app/pages/board-options.html').success(function (response) {
        $('.board-options').html(response);
        $http.get('http://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
            $scope.allOptions = response;
        });
    });
    $http.get('http://www.antitrustmonopoly.com/app/scripts/monopoly.json').success(function (response) {
        $scope.groups = response.propertyGroups;
        groups = response.propertyGroups;
        $scope.settings = response.gameSettings;
        $scope.players = response.players;
        $scope.currentPlayer = response.players[0];
        for (pl of $scope.players) {
            pl.companies.push(pl);
        }
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
        }).then(function () {
            $('.board-options').addClass('exit-frame');
            $('.final-container').addClass('enter-frame');
        });
    }

    /** App Methods **/
    $scope.setCompanyOrder = function (entity) {
        if (!entity.isProperty) {
            for (var i = 0; i < entity.directOwnership.length; i++) {
                var subEnt = entity.directOwnership[i];
                if (!subEnt.isProperty) {
                    if (subEnt.level <= entity.level) {
                        subEnt.level = entity.level + 1;
                        $scope.currentPlayer.maxLevel = Math.max($scope.currentPlayer.maxLevel, subEnt.level);
                    }
                    $scope.setCompanyOrder(entity.directOwnership[i]);
                }
            }
        }    
    }
    $scope.setAllCompaniesOrder = function () {
        var player = $scope.currentPlayer;
        player.maxLevel = 1;
        player.directOwnership.forEach(function(comp) {
            comp.level = 1;
        });
        for (var i = 0; i < player.directOwnership.length; i++) {
            $scope.setCompanyOrder(player.directOwnership[i]);
            $scope.currentPlayer.maxLevel = Math.max(player.maxLevel, player.directOwnership[i].level);
        }
    }
    $scope.setMonopolies = function () {
        var properties = $scope.currentPlayer.properties;
        var monopolies = $scope.currentPlayer.monopolies;
        for (var i in properties) {
            if (groups[properties[i].properties[0].groupInd].properties.length == properties[i].properties.length) {
                groups[properties[i].properties[0].groupInd].isReady = true;
            }
        }
        for (var j in monopolies) {
            if (groups[monopolies[j].properties[0].groupInd].properties.length != monopolies[j].properties.length) {
                $scope.currentPlayer.properties[j] = monopolies[j];
                delete $scope.currentPlayer.monopolies[j];
            }
        }
    }
    $scope.addMonopolyGroup = function (group) {
        if ($scope.groups[group.order].isReady) {
            $scope.currentPlayer.monopolies[group.order] = group;
            for (var prop of group.properties) {
                $scope.currentPlayer.directOwnership.push(prop);
            }
            delete $scope.currentPlayer.properties[group.order];
        }
    }
    $scope.sellProperty = function (property) {
        $scope.monopolies;
    }
    $scope.addCompanyToPlayer = function () {
        curPl = $scope.currentPlayer;
        var newComp = {
            'name': 'C' + curPl.companyNumber,
            'level': 1,
            'directOwnership': [],
            'isProperty': false
        };
        $scope.currentPlayer.companies.push(newComp);
        $scope.currentPlayer.directOwnership.push(newComp);
        $scope.currentPlayer.companyNumber += 1;
        $scope.setAllCompaniesOrder();
        $scope.updateCanvas();
    }
    
    $scope.addPropertyToPlayer = function (property) {
        var groupInd = 0;
        var propInd = 0;
        var done = false;
        for (var i = 0; i < $scope.groups.length && !done; i++) {
            var subIndex = $scope.groups[i].properties.indexOf(property);
            if (subIndex != -1) {
                groupInd = i;
                propInd = subIndex;
                done = true;
                break;
            }
        }
        var newProp = {
            'groupInd': groupInd,
            'propInd': propInd,
            'isProperty': true
        }
        if (typeof $scope.currentPlayer.properties[groupInd] === 'undefined') {
            $scope.currentPlayer.properties[groupInd] = { 'order': groupInd, properties: [] };
        }
        $scope.currentPlayer.properties[groupInd].properties.push(newProp);
        $scope.groups[groupInd].properties[propInd].owned = true;
        $scope.setMonopolies();
        $scope.updateCanvas();
    }
    
    $scope.nextPlayer = function () {
        var ind = $scope.players.indexOf($scope.currentPlayer) + 1;
        ind = (ind == $scope.players.length ? 0 : ind);
        console.log(ind);
        $scope.currentPlayer = $scope.players[ind];
        $scope.updateCanvas();
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
    $scope.treeUpdated = function () {
        $scope.setAllCompaniesOrder();
        $scope.updateCanvas();
        var active = $('.active-tooltip').removeClass('active-tooltip');
        console.log(active.children('.active'));
        $('.active').removeClass('active');
        $('.first').addClass('active');
    }
    $scope.sever = function (owner, subsidiary) {
        var index = owner.directOwnership.indexOf(subsidiary);
        if (index != -1) owner.directOwnership.splice(index, 1);
        $scope.treeUpdated();
    }
    $scope.addOwner = function (newOwner, newSubsidiary) {
        newOwner.directOwnership.push(newSubsidiary);
        $scope.treeUpdated();
    }

    $scope.updateCanvas = function () {
        canvas.width = canvas.scrollWidth;
        canvas.height = canvas.scrollHeight;
        canvasContext.clearRect(0, 0, $canvas.width, $canvas.width);
        // $scope.updateCompanyEntity($scope.currentPlayer);
        for (company of $scope.currentPlayer.companies) {
            $scope.updateCompanyEntity(company);
        }
    }

    $scope.updateCompanyEntity = function (company) {
        compInd = $scope.currentPlayer.companies.indexOf(company);
        compPos = getCenterPositionInCanvas($('#company-' + compInd), false);
        for (const subComp of company.directOwnership) {
            var subPos;
            if (subComp.isProperty) {
                subPos = getCenterPositionInCanvas($('#property-' + subComp.groupInd + '-' + subComp.propInd), true);
            } else {
                var subCompInd = $scope.currentPlayer.companies.indexOf(subComp);
                subPos = getCenterPositionInCanvas($('#company-' + subCompInd), true);
            }
            canvasContext.beginPath();
            canvasContext.moveTo(compPos.x, compPos.y);
            canvasContext.lineTo(subPos.x, subPos.y);
            canvasContext.stroke();
        }
    }

    $scope.iterateOver = function (num) {
        return new Array(num);
    }
});

/**
 * Gets the position of the center of the element
 * @param {DOM} : jQuery object
 * @param {Boolean} top - True if need index of the top of the box, false if the bottom
 * @return {JSON} x: x position in canvas, y: y position in canvas
 */
function getCenterPositionInCanvas(elem, top = true) {
    const canvasOffset = $canvas.offset();
    const elemOffset = elem.offset();
    var val = { x: elemOffset.left - canvasOffset.left, y: elemOffset.top - canvasOffset.top };
    val.x += elem.outerWidth() / 2;
    if (!top) val.y += elem.outerHeight();
    return val;
}

var canvas = document.getElementById('monopoly-canvas');
var $canvas = $(canvas);
var canvasContext = canvas.getContext('2d');

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

app.filter('doesNotOwn', function () {
    return function (companies, input) {
        return companies.filter(function (company) {
            return !subsidiariesInclude(input, company);
        });
    };
});

app.filter('notDirectlyOwnedBy', function () {
    return function (companies, keyCompany) {
        return companies.filter(function (owner) {
            return !owner.directOwnership.some(function (subsidiary) {
                return subsidiary === keyCompany;
            })
        });
    }
})

app.filter('directlyOwns', function () {
    return function (companies, keyCompany) {
        return companies.filter(function (owner) {
            return owner.directOwnership.some(function (subsidiary) {
                return subsidiary === keyCompany;
            })
        });
    }
});

app.directive('update-canvas-after', function () {
    return function ($scope, element, attrs) {
        if ($scope.$last) {
            $scope.updateCanvas();
        }
    }
})

app.directive('resize', function ($window) {
    return function ($scope) {
        $scope.updateCanvas();
    }
})