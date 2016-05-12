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

const redirectUrl = (window.location.hostname === '127.0.0.1') ? '/' : '/hour/'

homeApp.controller('homeCtrl', function (
  $scope,
  $interval,
  $location,
  $http,
  $localStorage
) {
  $scope.currentUser = {}

  $scope.lands = [];

  console.log($scope.currentUser, window.location)

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
        window.location.href = redirectUrl + '#/dead';
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
    $scope.isLoading = true;
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
        $('#userLoginModal').modal('show');
        $scope.isLoading = false;
        // setTimeout(window.location.href = redirectUrl + '#/dead';, 3000)
      }
    })
    .error(function(err) {
      console.log(err)
      $scope.isLoading = false;

    })
    $scope.userId = ''
  }

  $scope.logout = function () {
    delete $localStorage.user;
    // setTimeout(window.location.href = redirectUrl + '#/dead';, 2000)
  }

  $scope.getChineseLabel = function (englishName) {
    return chineseLabelOfCategory[englishName] || englishName
  }

  $scope.getBadgePath = function (englishName) {
    return categoriesPath[englishName]
  }

  // Land Section
  function findLand(landId) {
    var tempLand = {}
    for (var i = 0; i < $scope.lands.length; i++) {
      if ($scope.lands[i].landId === landId){
        tempLand = $scope.lands[i]
      }
    }
    return tempLand;
  }
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
          && Number($scope.bidTime) <= Number(findLand(landId).price)) {
        $scope.isLoading = true;
        $http
        .get(`${APIUrl}/land/buy?user=${$scope.currentUser._id}&land=${landId}&money=${$scope.bidTime}`)
        .success(function (data) {
          $('#buyLandModal').modal('hide');
          $scope.getTimeLeft();
          $scope.updateLocalStorage();
          $('#buySuccessModal').modal('show')
          $scope.isLoading = false;

        })
        .error(function (err) {
          console.log(err)
          $scope.isLoading = false;
          $scope.errorMessage = err.message;
        })
      } else {
        console.log(Number($scope.bidTime), findLand(landId))
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

  var timer = new Date();
  var startTime = timer.getTime();

  $scope.addInterest = function() {
    var timeLeft = $scope.timeLeft;
    var speed = $scope.center.speed;
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

  $scope.center = {'speed': 1} // 'start' or 'pause'
  $scope.redirected = false;
  $interval(function() {
    if ($scope.center.status != 'pause'
        && $scope.center.status != undefined
        && $scope.currentUser._id !== undefined
        && $scope.redirected === false) {
      $scope.addInterest();
      if (dead($scope.timeLeft)) {
        $scope.redirected = true;
        console.log(`user ${$scope.currentUser._id} is dead.`)
        window.location.href = redirectUrl + '#/dead';
      }
    }
  }, 997)

  $scope.closeLoginModal = function () {
    $('#userLoginModal').modal('hide');
  }
  $scope.closeLandSuccessModal = function () {
    $('#buySuccessModal').modal('hide');
  }
  var updateCenterTime = function () {
    $http
    .get(`${APIUrl}/center`)
    .success(function (data) {
      data.status = 'start'
      $scope.center = data;
    })
  }
  updateCenterTime()
  $scope.getTimeLeft()
  var updateCenterTimeInterval = setInterval($scope.getTimeLeft, 10000);
  // $scope.getTimeLeft()
  var updateCenterTimeInterval = setInterval(updateCenterTime, 30000);

  $scope.checkPositionAndBuyLand = function() {
    $('#checkPositionAndBuyLand')
      .modal({
        blurring: true
      })
      .modal('setting', 'transition', 'fade up')
      .modal('show')
    ;
    $http
    .get(`${APIUrl}/user/data?user=` + $localStorage.user._id)
    .success(function (data) {
      const whereStand = data.stand;
      if (whereStand == -1) {
        $scope.buyLandMessage = '你沒有站在土地上喔！'
      } else {
        $scope.currentLand = findLand(whereStand)
      }
    })
  }

  $scope.closePositionAndBuyLandModal = function() {
    $('#checkPositionAndBuyLand').modal('hide');
  }

  $scope.buyLandAtHome = function (landId) {
    console.log(`${$scope.currentUser._id} buys ${landId} with ${$scope.bidTime}`);
    // $scope.bidTime
    $scope.errorMessage = ''
    if (Number($scope.bidTime) == NaN) {
      $scope.errorMessage = '請輸入數字'
    } else {
      if (Number($scope.bidTime) >= 1) {
        $scope.isLoading = true;
        $http
        .get(`${APIUrl}/land/buy?user=${$scope.currentUser._id}&land=${landId}&money=${$scope.bidTime}`)
        .success(function (data) {
          $('#checkPositionAndBuyLand').modal('hide');
          $scope.getTimeLeft();
          $scope.updateLocalStorage();
          $('#checkPositionAndBuyLandSuccess').modal('show')
          $scope.isLoading = false;

        })
        .error(function (err) {
          console.log(err)
          $scope.isLoading = false;
          $scope.errorMessage = err.message;
        })
      } else {
        console.log(Number($scope.bidTime), findLand(landId))
        $scope.errorMessage = '花費時間必須大於一'
        console.log($scope.errorMessage)
      }
    }
  }
});


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
