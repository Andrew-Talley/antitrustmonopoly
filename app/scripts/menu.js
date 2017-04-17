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

function parseIntWithCommas(str) {
  return parseInt(str.replace(/,/g, ''));
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
  $scope.rules = "default"

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

      $scope.settings.accountingFee = 2 * /*response.multiplier*/1;
      $scope.settings.companyPurchase = 100 * /*response.multiplier*/1;
      $scope.settings.ownershipChange = 75 * /*response.multiplier*/1;

      $scope.settings.baseOdds = Math.pow((1/49), (1 / 3));
      $scope.settings.checkEveryTurn = true;
      $scope.settings.giveToBank = true;
      $scope.settings.governmentControl = false;

      $scope.currentPlayer = $scope.players[0];
    }).then(function () {
      $('.board-options').addClass('exit-frame');
      $('.final-container').addClass('enter-frame');
    });
  }

  $scope.updateHouseSettings = function () {
    console.log($scope.rules);
    switch ($scope.rules) {
      case "default":
        $scope.settings.checkEveryTurn = true;
        $scope.settings.giveToBank = true;
        $scope.settings.governmentControl = false;
        $scope.settings.baseOdds = Math.pow((1/49), (1 / 3));
        break;
      case "transfer":
        $scope.settings.checkEveryTurn = true;
        $scope.settings.giveToBank = false;
        $scope.settings.governmentControl = false;
        $scope.settings.baseOdds = Math.pow((1/49), (1 / 3));
        break;
      case "takeover":
        $scope.settings.checkEveryTurn = true;
        $scope.settings.giveToBank = false;
        $scope.settings.governmentControl = true;
        $scope.settings.baseOdds = Math.pow((1/49), (1 / 3));
        break;
      case "treble":
        $scope.settings.checkEveryTurn = false;
        $scope.settings.giveToBank = false;
        $scope.settings.governmentControl = false;
        $scope.settings.baseOdds = Math.pow((1/2), (1 / 3));
        break;
      default:
        $scope.settings.checkEveryTurn = true;
        $scope.settings.giveToBank = true;
        $scope.settings.governmentControl = false;
        break;
    }
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
    $scope.currentPlayer.costMessage = "Buying a new company cost $" + $scope.settings.companyPurchase;
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

  $scope.searchAndDisplayMonopoly = function (monopInd) {
    $scope.searchMonopoly(monopInd);
    $scope.showSearchResults();
  }

  $scope.searchMonopoly = function (monopInd) {
    var monopoly = $scope.currentPlayer.monopolies[monopInd];
    var playerInd = $scope.players.indexOf($scope.currentPlayer);

    if (monopoly.properties.every(function (prop) {
        return Math.random() < prop.probability;
      })) {
      $scope.currentPlayer.oldMonopolies.push(monopoly);
      $scope.groups[monopoly.properties[0].propInd].isReady = false;
      
      if ($scope.settings.giveToBank) {
        for (var prop in monopoly.properties) {
          $scope.groups[prop.groupInd].properties[prop.propInd].isOwned = false;
        }
      } else if (!$scope.settings.governmentControl) {
        var randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        for (var propInd in monopoly.properties) {
          const numPossiblePlayers = $scope.players.length - 1;
          var thisProp = monopoly.properties[propInd];
          var newPlayerIndex = randomSeed % (numPossiblePlayers);
          randomSeed = Math.floor(randomSeed / numPossiblePlayers);
          if (newPlayerIndex >= playerInd) newPlayerIndex += 1;
          if (typeof $scope.players[newPlayerIndex] === 'undefined') {
            alert("Something went wrong. Please roll a dice to determine who gets " + $scope.groups[thisProp.groupInd].properties[thisProp.propInd].name);
            console.error("The player is undefined");
            console.log(newPlayerIndex);
            console.log($scope.players);
            $scope.groups[thisProp.groupInd].properties[thisProp.propInd].isOwned = false;
          }
          $scope.addPropertyToSpecificPlayer($scope.players[newPlayerIndex], thisProp);
        }
      }
      
      delete $scope.currentPlayer.monopolies[monopInd];
    }
  }

  $scope.nextPlayer = function () {
    var ind = $scope.players.indexOf($scope.currentPlayer) + 1;
    ind = (ind == $scope.players.length ? 0 : ind);
    $scope.currentPlayer = $scope.players[ind];

    if ($scope.settings.checkEveryTurn) {    
      for (var monopInd in $scope.currentPlayer.monopolies) {
        $scope.searchMonopoly(monopInd);      
      }
      $scope.showSearchResults();
    }
    
    $scope.accountingFees();

    $scope.updateCanvas();
  }

  $scope.showSearchResults = function () {
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
  }

  $scope.accountingFees = function () {
    var accountingFees = 0;
    $scope.currentPlayer.subsidiaries.forEach(function (subsidiary) {
      accountingFees += totalAccounting(subsidiary);
    });
    accountingFees *= $scope.settings.accountingFee;
    if (accountingFees != 0) {
      $scope.currentPlayer.costMessage = "Your accounting fees are $" + (accountingFees);
      showMessage();
    } else {
      console.log(accountingFees);
    }
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

    $scope.updateHouseSettings();
    if (!$scope.settings.checkEveryTurn) $('.player-monopolies').addClass('user-check');
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
    canvas.width = canvas.scrollWidth * 2;
    canvas.height = canvas.scrollHeight * 2;
    canvasContext.clearRect(0, 0, $canvas.width * 2, $canvas.width * 2);
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
          canvasContext.lineWidth = 2;
          canvasContext.moveTo(compPos.x * 2, compPos.y * 2);
          canvasContext.lineTo(subPos.x * 2, subPos.y * 2);
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
        var odds = $scope.getBaseOdds(property);
        initialValues.push(odds);
      };
      var values = initialValues.map(function (x, ind, array) {
        x *= 2;
        array.forEach(function (val, index) {
          if (index != ind) x += val;
        })
        x /= (array.length + 1);
        return x;
      });
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
    $scope.accountingFees();
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
    return ($scope.settings.governmentControl ? "the Government" : "the bank");
  }

  $scope.getBaseOdds = function (prop) {
    var property = $scope.groups[prop.groupInd].properties[prop.propInd];
    const rentIncrease = (property.rent - property.baseRent) / property.baseRent;
    console.log(rentIncrease);
    const pathLength = 1 / (connectionsTo($scope.currentPlayer, prop));
    console.log(pathLength);
    const dist = distance($scope.currentPlayer, prop);
    console.log(dist);
    console.log($scope.settings.baseOdds);
    return rentIncrease * pathLength * $scope.settings.baseOdds / dist;
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

function distance(testCompany, keyCompany) {
  if (testCompany === keyCompany) return 0;
  if (testCompany.isProperty || testCompany.subsidiaries.length == 0) return -1;
  var minPath = Number.MAX_SAFE_INTEGER;
  testCompany.subsidiaries.forEach(function (subsidiary) {
    var dis = distance(subsidiary, keyCompany);
    if (dis != -1) {
      minPath = Math.min(minPath, dis + 1);
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

function totalAccounting(company) {
  if (company.isProperty || company.subsidiaries.length == 0) return 0;
  var connections = 0;
  company.subsidiaries.forEach(function (subsidiary) {
    connections += totalAccounting(subsidiary) + 1;
  });
  return connections;
}

function showMessage() {
  $('.cost').addClass('active');
  window.setTimeout(function () { $('.cost').removeClass('active') }, 2000);
}

function addThousandCommas(number) {
  if (number < 1000) return number;
  else return addThousandCommas(Math.floor(number / 1000)) + "," + (number % 1000);
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

app.filter('probabilityPrettify', function () {
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