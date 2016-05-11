var homeApp = angular.module('homeApp', ['ngRoute', 'ngStorage']);
console.log('hello app')

const APIUrl = 'https://art-festival.herokuapp.com';
// const APIUrl = 'http://localhost:5000';
// const APIUrl = 'https://crossorigin.me/https://art-festival.herokuapp.com';

const categoriesPath = {
  'learning': 'src/badges/learning.svg',
  'health': 'src/badges/health.svg',
  'entertainment': 'src/badges/entertainment.svg',
  'affection': 'src/badges/affection.svg',
  'career': 'src/badges/career.svg'
}

const chineseLabelOfCategory = {
  'learning': '學習',
  'health': '健康',
  'entertainment': '娛樂',
  'affection': '感情',
  'career': '事業'
}

homeApp.controller('homeCtrl', function ($scope, $location, $http, $localStorage) {
  $scope.currentUser = {}

  $scope.lands = [];

  console.log($scope.currentUser)

  // Time Section
  $scope.getTimeLeft = function () {
    if ($scope.checkLogin()) {
      $http
      .get(`${APIUrl}/user/time?user=${$localStorage.user._id}`)
      .success(function (data) {
        $scope.timeLeft = data
      })
      .error(function (err) {
        console.log(err)
      })
    }
  }


  $scope.getLands = function () {
    // Land Section
    $http
    .get(`${APIUrl}/land/data?land=all`)
    .success(function (data) {
      console.log('land load success')
      $scope.lands = []
      for (var i = 0; i < Object.keys(data).length; i++) {
        var key = Object.keys(data)[i]
        $scope.lands.push({
          landId: data[key]._id,
          status: data[key].owner._id > 0,
          category: chineseLabelOfCategory[data[key].category],
          content: data[key].content,
          badgePath: categoriesPath[data[key].category],
          interest: data[key].interest,
          price: data[key].price
        })
      }
    })
    .error(function(err){
      console.log(err)
    })
  }

  // User Authentication Section
  $scope.checkLogin = function () {
    return ($localStorage.user !== undefined)
  }

  $scope.updateLocalStorage = function () {
    $http
    .get(APIUrl + '/user/data?user=' + $scope.currentUser._id)
    .success(function(data) {
      $scope.landHoldings = []
      var tempLandIds = []
      Object.keys(data.lands).forEach(function (cat) {
        data.lands[cat].forEach(function (landId) {
          tempLandIds.push(cat.charAt(0) + landId)
        })
      })
      tempLandIds.forEach(function (landId) {
        // body...
        for (var i = 0; i < $scope.lands.length; i++) {
          if ($scope.lands[i].landId === landId) {
            $scope.landHoldings.push($scope.lands[i])
          }
        }
      })
      data.lands = $scope.landHoldings
      $scope.currentUser = data
      $localStorage.user = data
      $scope.getTimeLeft();
    })
  }

  $scope.localLogin = function () {
    if ($scope.checkLogin()) {
      $scope.currentUser = $localStorage.user;
      console.log('login from local')
      $scope.getTimeLeft();
      if (!$scope.currentUser.isAlive) {
        console.log(`user ${$scope.currentUser._id} is dead.`)
        window.location.href = '/dead';
      }
    }
  }
  $scope.getLands();
  $scope.localLogin();

  $scope.isAlive = function (userId) {
    $http
    .get(`${APIUrl}/user/data/?user=${userId}`)
    .success(function(data){
      return data.isAlive
    })
    .error(function(err){
      console.log(err)
    })
  }

  $scope.login = function() {
    // const userId = '10004'
    $http
    .get(APIUrl + '/user/data?user=' + $scope.userId)
    .success(function(data){
      if (data) {
        $scope.landHoldings = []
        var tempLandIds = []
        Object.keys(data.lands).forEach(function (cat) {
          data.lands[cat].forEach(function (landId) {
            tempLandIds.push(cat.charAt(0) + landId)
          })
        })
        tempLandIds.forEach(function (landId) {
          // body...
          for (var i = 0; i < $scope.lands.length; i++) {
            if ($scope.lands[i].landId === landId) {
              $scope.landHoldings.push($scope.lands[i])
            }
          }
        })
        data.lands = $scope.landHoldings
        console.log($scope.currentUser)
        $scope.currentUser = data
        $localStorage.user = data
        $scope.getTimeLeft();
        // setTimeout(window.location.href = '/', 3000)
      }
    })
    .error(function(err) {
      console.log(err)
    })
    $scope.userId = ''
  }

  $scope.logout = function () {
    delete $localStorage.user;
    // setTimeout(window.location.href = '/', 2000)
  }

  $scope.getChineseLabel = function (englishName) {
    return chineseLabelOfCategory[englishName] || englishName
  }

  $scope.getBadgePath = function (englishName) {
    return categoriesPath[englishName]
  }

  // Land Section

  $scope.getLands();
  $scope.errorMessage = '';

  $scope.buyLand = function (landId) {
    console.log(`${$scope.currentUser._id} buys ${landId} with ${$scope.bidTime}`);
    // $scope.bidTime
    $scope.errorMessage = ''
    if (Number($scope.bidTime) == NaN) {
      $scope.errorMessage = '請輸入數字'
    } else {
      if (Number($scope.bidTime) > 0
          && Number($scope.bidTime) <= Number($scope.lands[landId].price)) {
        $http
        .get(`${APIUrl}/land/buy?user=${$scope.currentUser._id}&land=${landId}&money=${$scope.bidTime}`)
        .success(function (data) {
          $('#buyLandModal')
            .modal('hide')
          ;
          $scope.getTimeLeft();
          $scope.updateLocalStorage();
        })
        .error(function (err) {
          console.log(err)
          $scope.errorMessage = err.message;
        })
      } else {
        $scope.errorMessage = '花費時間必須大於零'
        console.log($scope.errorMessage)
      }
    }
  }

  $scope.getLandInfo = function(landId) {
    $scope.currentLand = getLand(landId)
    console.log($scope.currentLand)

    $('#buyLandModal')
      .modal({
        blurring: true
      })
      .modal('setting', 'transition', 'fade up')
      .modal('show')
    ;
  }

  var getLand = function(landId) {
    for (var i = 0; i < $scope.lands.length; i++) {
      if ($scope.lands[i].landId === landId){
        return $scope.lands[i]
      }
    }
  }

  // Route NavBar Section
  $scope.isActive = function(path) {
    return $location.path() == path
  }
  $scope.timeLeft = {
    'hours': 0,
    'interest': 0,
    'milliseconds': 0,
    'mins': 0,
    'secs': 0
  }

  $scope.center = {'speed': 1} // 'start' or 'pause'

  var timeLeftInterval = setInterval(function() {
    if ($scope.center.status != 'pause'
        && $scope.center.status != undefined
        && $scope.currentUser !== {}) {
      console.log($scope.currentUser.timeLeft)
      $scope.timeLeft = addInterest($scope.timeLeft, $scope.center.speed);
      $scope.currentUser.timeLeft = $scope.timeLeft
      if (dead($scope.currentUser)) {
        if (!$scope.isAlive($scope.currentUser._id)) {
          console.log(`user ${$scope.currentUser._id} is dead.`)
          window.location.href = '/dead';
        }
      }
    }
  }, 1000)

  var updateCenterTime = function () {
    $http
    .get(`${APIUrl}/center`)
    .success(function (data) {
      data.status = 'start'
      $scope.center = data;
    })
  }
  updateCenterTime()
  var updateCenterTimeInterval = setInterval($scope.getTimeLeft, 10000);
  // $scope.getTimeLeft()
  // var updateCenterTimeInterval = setInterval($scope.getTimeLeft, 3000);

});

var timer = new Date();
var startTime = timer.getTime();

function addInterest(timeLeft, speed) {
  timeLeft.secs += (timeLeft.interest);
  timeLeft.secs -= (speed);

  var time = timeLeft.hours*3600 + timeLeft.mins*60 + timeLeft.secs;
  timeLeft.hours = Math.floor(time / 3600);
  timeLeft.mins = Math.floor((time % 3600) / 60);
  timeLeft.secs = Math.floor((time % 3600) % 60);
  return timeLeft;
}

function dead(timeLeft) {
  var time = timeLeft.hours*3600 + timeLeft.mins*60 + timeLeft.secs;
  if (time < 0)
    return true;
  else
    return false;
}


homeApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: './home.html',
        controller: 'homeCtrl'
      })
      .when('/landmap', {
        templateUrl: './landmap.html',
        controller: 'homeCtrl'
      })
      .when('/login', {
        templateUrl: './login.html',
        controller: 'homeCtrl'
      })
      .when('/leaderboard', {
        templateUrl: './leaderboard.html',
        controller: 'homeCtrl'
      })
      .when('/holdings', {
        templateUrl: './holdings.html',
        controller: 'homeCtrl'
      })
      .when('/dead', {
        templateUrl: './dead.html',
        controller: 'homeCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
