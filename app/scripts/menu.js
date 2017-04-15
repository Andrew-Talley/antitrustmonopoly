/*
 * TODO:
 * Adding a monopoly group to a player causes an error. It looks like it comes from the $last element's call to $scope.updateCanvas()
 * Start using popper.js framework so the popup things don't look like shit and so we don't have a div with a class that's barely ironically called "pointy"?
 */

function toProbability(ratio) {
  return (ratio) / (ratio + 1);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

var app = angular.module('app', []);
app.controller('appController', function ($scope, $http) {
  $scope.allOptions = [];
  $scope.groups = [];
  $scope.settings = {};
  $scope.currentPlayer = {};
  $scope.numPlayers = 4;
  $scope.players = [];
  $scope.colors = ['#000', '#00f', '#0f0', '#f00', '#0ff', '#f0f', '#ff0'];
  $http.get('http://www.antitrustmonopoly.com/app/scripts/game-types.json').success(function (response) {
    $scope.allOptions = response;
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
    if (option.text == 'Monopoly (post-2008)' || option.text == 'Classic Monopoly (pre-2008)') {
    url = "https://www.antitrustmonopoly.com/app/scripts/monopoly.json";
    } else if (option.text == "Monopoly: Here & Now") {
        url = "https://www.antitrustmonopoly.com/app/scripts/here-and-now.json";
    } else {
      url = "https://www.antitrustmonopoly.com/app/scripts/custom.json"
    }
    $http.get(url).success(function (response) {
      for (group of response.propertyGroups) {
        group.isReady = false;
        for (prop of group.properties) {
          prop.owned = false;
          prop.rent = prop.baseRent * 2;
          prop.isProperty = true;
        }
      }
      $scope.groups = response.propertyGroups;
      $scope.settings = response.gameSettings;
      $scope.currentPlayer = $scope.players[0];
    }).then(function () {
      $('.board-options').addClass('exit-frame');
      $('.final-container').addClass('enter-frame');
    });
  }

  /** App Methods **/
  $scope.setCompanyOrder = function (entity) {
    if (!entity.isProperty) {
      for (var i = 0; i < entity.subsidiaries.length; i++) {
        var subEnt = entity.subsidiaries[i];
        if (!subEnt.isProperty) {
          if (subEnt.level <= entity.level) {
            subEnt.level = entity.level + 1;
            $scope.currentPlayer.maxLevel = Math.max($scope.currentPlayer.maxLevel, subEnt.level);
          }
          $scope.setCompanyOrder(entity.subsidiaries[i]);
        }
      }
    }
  }
  $scope.setAllCompaniesOrder = function () {
    var player = $scope.currentPlayer;
    player.maxLevel = 1;
    player.companies.forEach(function (comp) {
      if (comp !== player) {
        comp.level = 1;
      }
    });
    for (company of player.companies) {
      $scope.setCompanyOrder(company);
      $scope.currentPlayer.maxLevel = Math.max(player.maxLevel, company.level);
    }
  }
  $scope.setMonopolies = function () {
    var properties = $scope.currentPlayer.properties;
    var monopolies = $scope.currentPlayer.monopolies;
    for (var i in properties) {
      if ($scope.groups[properties[i].properties[0].groupInd].properties.length == properties[i].properties.length) {
        $scope.groups[properties[i].properties[0].groupInd].isReady = true;
      } else {
        $scope.groups[properties[i].properties[0].groupInd].isReady = false;
      }
    }
    for (var j in monopolies) {
      if ($scope.groups[monopolies[j].properties[0].groupInd].properties.length != monopolies[j].properties.length) {
        $scope.currentPlayer.properties[j] = monopolies[j];
        delete $scope.currentPlayer.monopolies[j];
      }
    }
  }
  $scope.removeProperty = function (propGroup, ind) {
    var prop = propGroup.properties[ind];
    $scope.groups[prop.groupInd].properties[prop.propInd].owned = false;
    propGroup.properties.splice(ind, 1);
    $scope.setMonopolies();
  }
  $scope.addMonopolyGroup = function (group, event) {
    if (!$(event.target).hasClass('fa')){
      if ($scope.groups[group.order].isReady) {
        $scope.currentPlayer.monopolies[group.order] = group;
        for (var prop of group.properties) {
          $scope.currentPlayer.subsidiaries.push(prop);
        }
        delete $scope.currentPlayer.properties[group.order];
        $scope.setDiscoveryOdds();
      }
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
      'subsidiaries': [],
      'isProperty': false
    };
    $scope.currentPlayer.companies.push(newComp);
    $scope.currentPlayer.subsidiaries.push(newComp);
    $scope.currentPlayer.companyNumber += 1;
    $scope.currentPlayer.costMessage = "Buying a new company cost " + $scope.settings.companyPurchase;
    showMessage();
    $scope.setAllCompaniesOrder();
    $scope.updateCanvas();
  }

  $scope.addPropertyToSpecificPlayer = function (player, property) {
    if (typeof player.properties[property.groupInd] === 'undefined') {
      player.properties[property.groupInd] = { 'order': property.groupInd, properties: [] };
    }
    player.properties[property.groupInd].properties.push(property);
    $scope.groups[property.groupInd].properties[property.propInd].owned = true;
    $scope.setMonopolies();
  }

  $scope.addPropertyToPlayer = function (property) {
    var groupInd = 0;
    var propInd = 0;
    for (var i = 0; i < $scope.groups.length; i++) {
      var subIndex = $scope.groups[i].properties.indexOf(property);
      if (subIndex != -1) {
        groupInd = i;
        propInd = subIndex;
        break;
      }
    }
    var newProp = {
      'groupInd': groupInd,
      'propInd': propInd,
      'isProperty': true
    }
    $scope.addPropertyToSpecificPlayer($scope.currentPlayer, newProp);
  }

  $scope.nextPlayer = function () {
    var ind = $scope.players.indexOf($scope.currentPlayer) + 1;
    ind = (ind == $scope.players.length ? 0 : ind);
    $scope.currentPlayer = $scope.players[ind];

    for (var monopInd in $scope.currentPlayer.monopolies) {
      var monopoly = $scope.currentPlayer.monopolies[monopInd];


      if (monopoly.properties.every(function (prop) {
        return Math.random() < prop.probability;
      })) {
        $scope.currentPlayer.oldMonopolies.push(monopoly);
        var randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        $scope.groups[monopoly.properties[0].propInd].isReady = false;
        for (var propInd in monopoly.properties) {
          const numPossiblePlayers = $scope.players.length - 1;
          var thisProp = monopoly.properties[propInd];
          var newPlayerIndex = randomSeed % (numPossiblePlayers);
          randomSeed = Math.floor(randomSeed / numPossiblePlayers);
          if (newPlayerIndex >= ind) newPlayerIndex += 1;
          if (typeof $scope.players[newPlayerIndex] === 'undefined') {
            console.error("The player is undefined");
            console.log(newPlayerIndex);
            console.log($scope.players);
          }
          $scope.addPropertyToSpecificPlayer($scope.players[newPlayerIndex], thisProp);
        }
        delete $scope.currentPlayer.monopolies[monopInd];
      }
    }
    if ($scope.currentPlayer.oldMonopolies.length > 0) {
      $('.popup').addClass('found');
      $('.popup').removeClass('show');
      $('.popup').addClass('show');
      $scope.setMonopolies();
    } else if (!isEmpty($scope.currentPlayer.monopolies)) {
      $('.popup').removeClass('found');
      $('.popup').removeClass('show');
      $('.popup').addClass('show');
    }
    

    $scope.updateCanvas();
  }
  $scope.startGame = function () {
    $('.container').addClass('blacken');
    window.setTimeout(function () {
      $('.final-container').removeClass('enter-frame');
      $('.game').addClass('show');
    }, 1000);

    for (var i = 0; i < $scope.numPlayers; i++) {
      $scope.players.push({
        "name": "Player " + (i + 1),
        "properties": {},
        "monopolies": {},
        "companies": [],
        "subsidiaries": [],
        "oldMonopolies": [],
        "maxLevel": 0,
        "level": 0,
        "companyNumber": 1,
        "costMessage": ""
      });
      $scope.players[i].companies.push($scope.players[i]);
    }
    $scope.currentPlayer = $scope.players[0];
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
    $('.active').removeClass('active');
    $('.first').addClass('active');
  }
  $scope.sever = function (owner, subsidiary) {
    var index = owner.subsidiaries.indexOf(subsidiary);
    if (index != -1) owner.subsidiaries.splice(index, 1);
    $scope.treeUpdated();
    $scope.setDiscoveryOdds();
  }
  $scope.addOwner = function (newOwner, newSubsidiary) {
    newOwner.subsidiaries.push(newSubsidiary);
    $scope.treeUpdated();
    $scope.currentPlayer.costMessage = "Adding a new owner cost $" + $scope.settings.ownershipChange;
    showMessage();
    $scope.setDiscoveryOdds();
  }
  $scope.updateCanvas = function () {
    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
    canvasContext.clearRect(0, 0, $canvas.width, $canvas.width);
    if (typeof $scope.currentPlayer.companies !== 'undefined') {
      for (company of $scope.currentPlayer.companies) {
        $scope.updateCompanyEntity(company);
      }
    }
  }
  $scope.updateCompanyEntity = function (company) {
    compInd = $scope.currentPlayer.companies.indexOf(company);
    compPos = getCenterPositionInCanvas($('#company-' + compInd), false);
    for (const subsidiary of company.subsidiaries) {
      var elem;
      if (subsidiary.isProperty) {
        elem = $('#property-' + subsidiary.groupInd + '-' + subsidiary.propInd);
      } else {
        elem = $('#company-' + $scope.currentPlayer.companies.indexOf(subsidiary));
      }
      if (typeof elem !== 'undefined') {
        try {
          var subPos = getCenterPositionInCanvas(elem, true);
          var subLevel = subsidiary.level;
          canvasContext.beginPath();
          canvasContext.moveTo(compPos.x, compPos.y);
          canvasContext.lineTo(subPos.x, subPos.y);
          canvasContext.strokeStyle = $scope.colors[company.level % $scope.colors.length];
          canvasContext.stroke();
        } catch (error) {}
      }
    }
  }

  $scope.setDiscoveryOdds = function () {
    for (var groupInd in $scope.currentPlayer.monopolies) {
      var group = $scope.currentPlayer.monopolies[groupInd];
      var initialValues = [];
      for (var propInd in group.properties) {
        var property = group.properties[propInd];
        var realProp = $scope.groups[property.propInd].properties[property.groupInd];
        var odds = getBaseOdds(realProp.rent, realProp.baseRent, connectionsTo($scope.currentPlayer, property), distance($scope.currentPlayer, property));
        initialValues.push(odds);
      };
      console.log(initialValues);
      var values = initialValues.map(function (x, ind, array) {
        x *= 2;
        array.forEach(function (val, index) {
          if (index != ind) x += val;
        })
        x /= (array.length + 1);
        return x;
      });
      console.log(values);
      for (var propInd in group.properties) {
        group.properties[propInd].probability = toProbability(values.shift());
      };
    };
  }

  $scope.iterateOver = function (num) {
    return new Array(num);
  }

  $scope.hidePopup = function () {
    $('.popup').removeClass('show', 'found');
    $scope.currentPlayer.oldMonopolies = [];
  }

  $scope.nameOfOwner = function (property) {
    for (player of $scope.players) {
      for (group in player.properties) {
        for (prop of player.properties[group].properties) {
          if (property === prop) {
            return player.name;
          }
        }
      }
    }
    return "the bank";
  }
});

const baseOddsMultiplier = 1 / (16 * Math.pow(5, (1 / 3)));

/**
 * Return the intial odds ratio for a given property
 * @param {Number} newRent - The current rent for the property
 * @param {Number} oldRent - The old rent for the property
 * @param {JSON} property - Property for odds
 */
function getBaseOdds(newRent, oldRent, pathLength, distance) {
  var rentIncrease = (newRent - oldRent) / oldRent;
  var adjustedPathLength = 1 / (pathLength + Math.pow(5, (-1 / 3)));
  var finalValue = rentIncrease * adjustedPathLength * baseOddsMultiplier / distance;
  return finalValue;
}

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

function distance(testCompany, keyCompany) {
  if (testCompany === keyCompany) return 0;
  if (testCompany.isProperty || testCompany.subsidiaries.length == 0) return -1;
  var minPath = Number.MAX_SAFE_INTEGER;
  testCompany.subsidiaries.forEach(function (subsidiary) {
    var dis = distance(subsidiary, keyCompany);
    if (dis != -1) {
      minPath = Math.min(minPath, distance(subsidiary, keyCompany));
    }
  });
  return minPath;
}

/**
 * Recursively check for one company owning a second
 * @param {JSON} testCompany - The company to check
 * @param {JSON} keyCompany - The company to check is included
 */
function subsidiariesInclude(testCompany, keyCompany) {
  if (testCompany === keyCompany) return true;
  if (testCompany.isProperty || testCompany.subsidiaries.length == 0) return false;
  return testCompany.subsidiaries.some(function (subsidiary) {
    return subsidiariesInclude(subsidiary, keyCompany);
  });
}

/**
 * Finds the number of connections from one company to another through subsidiaries
 * @param {JSON} testCompany - The company to check
 * @param {JSON} keyCompany - The company to check the number of connections to
 */
function connectionsTo(testCompany, keyCompany) {
  if (testCompany === keyCompany) return 1;
  if (testCompany.isProperty || testCompany.subsidiaries.length == 0) return -1;

  var allConnections = [];
  testCompany.subsidiaries.forEach(function (subsidiary) {
    allConnections.push(connectionsTo(subsidiary, keyCompany));
  });
  if (allConnections.every(function (val) {
    return val == -1
  })) return -1;

  var totalValue = 0;
  allConnections.forEach(function (value) {
    if (value != -1) totalValue += value;
  })
  return totalValue;
}

function showMessage() {
  $('.cost').addClass('active');
  window.setTimeout(function () { $('.cost').removeClass('active') }, 2000);
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
      return !owner.subsidiaries.some(function (subsidiary) {
        return subsidiary === keyCompany;
      })
    });
  }
});

app.filter('directlyOwns', function () {
  return function (companies, keyCompany) {
    return companies.filter(function (owner) {
      return owner.subsidiaries.some(function (subsidiary) {
        return subsidiary === keyCompany;
      })
    });
  }
});

app.filter('probabilityPrettify', function() {
  return function (value) {
    return (value * 100).toFixed(1) + '%';
  }
})

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
});

$('.cost').click = function () {
  $(this).removeClass('active');
}