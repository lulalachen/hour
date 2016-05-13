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

const getCategoryByFirstLetter = {
  'a': 'a',
  'l': 'b',
  'c': 'c',
  'h': 'd',
  'e': 'e'
};

const getOriginalCategoryLetter = {
  'a': 'affection',
  'b': 'learning',
  'c': 'career',
  'd': 'health',
  'e': 'entertainment'
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
      $scope.updateLocalStorage();
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
          const transformedLetter = getCategoryByFirstLetter[cat.charAt(0)]
          tempLandIds.push(transformedLetter + landId)
        })
      })
      tempLandIds.forEach(function (landId) {
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

  $scope.isAlive = function (userId) {
    $http
    .get(`${APIUrl}/user/data/?user=${userId}`)
    .success(function(data){
      console.log(data.isAlive)
      return data.isAlive
    })
    .error(function(err){
      console.log(err)
    })
  }

  $scope.checkAliveAndRedirect = function () {
    const userId = $scope.currentUser._id;
    $http
    .get(`${APIUrl}/user/data/?user=${userId}`)
    .success(function(data){
      if (!data.isAlive) {
        console.log(`user ${$scope.currentUser._id} is dead.`)
        window.location.href = redirectUrl + '#/dead';
      } else {
        console.log(`user ${$scope.currentUser._id} is alive.`)
      }
    })
    .error(function(err){
      console.log(err)
    })
  }

  $scope.localLogin = function () {
    if ($scope.checkLogin()) {
      $scope.currentUser = $localStorage.user;
      console.log('login from local')
      $scope.updateLocalStorage();
      $scope.checkAliveAndRedirect();
    }
  }

  $scope.getLands();
  $scope.localLogin();



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
    timeLeft.secs = (time % 3600) % 60;
    return timeLeft;
  }

  function dead(timeLeft) {
    var time = timeLeft.hours*3600 + timeLeft.mins*60 + timeLeft.secs;
    if (time < 0)
      return true;
    else
      return false;
  }

  $scope.center = { 'speed': 1, 'status': 'pause' } // 'start' or 'pause'
  $scope.redirected = false;

  $interval(function() {
    if ($scope.center.status != 'pause'
        && $scope.center.status != undefined
        && $scope.currentUser._id !== undefined
        && $scope.redirected === false) {

      $scope.addInterest();

      if (dead($scope.timeLeft)) {
        $scope.redirected = true;
        $scope.checkAliveAndRedirect()
      }
    }
  }, 997)

  $scope.closeLoginModal = function () {
    $('#userLoginModal').modal('hide');
    window.location.href = redirectUrl + '#/';
  }

  $scope.closeLandSuccessModal = function () {
    $('#buySuccessModal').modal('hide');
  }

  var updateCenterTime = function () {
    $http
    .get(`${APIUrl}/center`)
    .success(function (data) {
      console.log(data.status)
      $scope.center = data;
    })
  }
  updateCenterTime()
  $scope.getTimeLeft()
  var updateTimeLeft = setInterval($scope.getTimeLeft, 99997);
  // $scope.getTimeLeft()
  var updateCenterTimeInterval = setInterval(updateCenterTime, 3000);
  $scope.buyLandMessage = ''
  $scope.checkPositionAndBuyLand = function() {
    $scope.isLoading = true
    $http
    .get(`${APIUrl}/user/data?user=` + $localStorage.user._id)
    .success(function (data) {
      $scope.isLoading = false
      const whereStand = data.stand;
      if (whereStand == -1) {
        $scope.buyLandMessage = '你沒有站在土地上喔！'
      } else {
        $('#checkPositionAndBuyLand')
          .modal({
            blurring: true
          })
          .modal('setting', 'transition', 'fade up')
          .modal('show')
        ;
        $scope.currentLand = findLand(whereStand)
      }
    })
    .error(function(err){
      $scope.isLoading = false
    })
  }

  $scope.closePositionAndBuyLandModal = function() {
    $('#checkPositionAndBuyLand').modal('hide');
  }

  $scope.username = '';

  $scope.changeName = function () {
    $scope.isLoading = true;
    $http
    .get(`${APIUrl}/user/modify?name=${$scope.username}&user=${$scope.currentUser._id}`)
    .success(function(data){
      if ($scope.username !== ''){
        $scope.currentUser.name = $scope.username;
        $localStorage.user.name = $scope.username;
      }
      $scope.username = '';
      $scope.isLoading = false;
    })
    .error(function(err){
      console.log(err)
      $scope.username = '';
      $scope.isLoading = false;
    })
  }
  $scope.leaderboardUsers = []
  $scope.getLeaderBoard = function() {
    $http
    .get(`${APIUrl}/user/data?user=all`)
    .success(function(data){
      $scope.leaderboardUsers = []
      Object.keys(data).forEach(function(userId) {
        if (userId < 20) {
          var tempLandIds = []
          var tempLandHoldings = []
          var landCatsCounter = {}

          const letters = ['a', 'b', 'c', 'd', 'e'];
          letters.forEach(function(letter){
            landCatsCounter[letter] = {
              count: 0,
              category: getOriginalCategoryLetter[letter],
              badgePath: categoriesPath[getOriginalCategoryLetter[letter]]
            }
          })

          Object.keys(data[userId].lands).forEach(function (cat) {
            data[userId].lands[cat].forEach(function (landId) {
              if (landId !== -1){
                landCatsCounter[getCategoryByFirstLetter[cat.charAt(0)]].count += 1
                tempLandIds.push(cat.charAt(0) + landId)
              }
            })
          })

          data[userId].landCats = []
          Object.keys(landCatsCounter).forEach(function(landCat) {
            data[userId].landCats.push(landCatsCounter[landCat])
          })
          $scope.leaderboardUsers.push(data[userId])
        }
      })

    })
    .error(function(err){
      console.log(err)
    })
  }

  $scope.getLeaderBoard()
  $interval($scope.getLeaderBoard, 10000)

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
          $scope.errorMessage = err.message || '連線問題可以再試一次';
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
      // .when('/leaderboard', {
      //   templateUrl: './leaderboard.html',
      //   controller: 'homeCtrl'
      // })
      // .when('/holdings', {
      //   templateUrl: './holdings.html',
      //   controller: 'homeCtrl'
      // })
      .when('/settings', {
        templateUrl: './settings.html',
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
