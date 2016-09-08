(function () {
    var de = angular.module('details', ['ngCookies']);

    de.controller('detailsCtrl', ['$routeParams', '$location', '$http', '$scope', '$cookieStore', '$window', '$filter', '$rootScope',
            function ($routeParams, $location, $http, $scope, $cookieStore, $window, $filter, $rootScope) {

                // Toastr options
                toastr.options = {
                    "debug": false,
                    "newestOnTop": false,
                    "positionClass": "toast-top-center",
                    "closeButton": true,
                    "toastClass": "animated fadeInDown",
                    "timeOut": "2000",
                };

                $scope.offset = 0;
                $scope.to = 30000;
                $scope.amountOfCompetitors = 7;

                $('.showhide').click(function (event) {
                    event.preventDefault();
                    var hpanel = $(this).closest('div.hpanel');
                    var icon = $(this).find('i:first');
                    var body = hpanel.find('div.panel-body');
                    var footer = hpanel.find('div.panel-footer');
                    body.slideToggle(300);
                    footer.slideToggle(200);

                    // Toggle icon from up to down
                    icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                    hpanel.toggleClass('').toggleClass('panel-collapse');
                    setTimeout(function () {
                        hpanel.resize();
                        hpanel.find('[id^=map-]').resize();
                    }, 50);
                });

                $scope.getRemoteBookDetails = function(){
                  $http.get("https://isbn.hpi.framsteg.de/proxy/?api_key=1SA!dsaSAdoh23!s&isbn="+$scope.isbn, { cache: true}).then(function(response) {
                      $scope.remoteBookDetails = response.data;
                  });
                }

                $scope.getBookData = function(){
                  var querystring = '?';
                  if ($scope.offset != null && $scope.to) {
                      querystring += 'from=' + $scope.offset + '&to=' + $scope.to;
                  }
                  $http.get("/api/book/"+$scope.isbn+querystring, { cache: true}).then(function(response) {
                      $scope.bookData = response.data;
                      $scope.processData();
                  });
                }

                var l = $( '.ladda-button-demo' ).ladda();
                l.click(function(){
                    $("#loadingModal").modal("show");
                    l.ladda( 'start' );
                    $scope.getBookData();

                });
                $("#loadingModal").modal("show");
                l.ladda( 'start' );

                // if isbn is defined in routeParams show detail page
                if(angular.isDefined($routeParams.id)){
                  $scope.remoteBookDetails = {};
                  $scope.isbn = $routeParams.id;
                  $scope.getRemoteBookDetails();
                  $scope.getBookData();
                //otherwise show overview of all books
                } else {
                  $window.location.href = '/index.html#/books';
                }

                $scope.propertyName = 'age';
                $scope.reverse = true;

                $scope.sortBy = function(propertyName) {
                    $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;

                    if(propertyName.indexOf("Competitor") > -1){
                      var id = propertyName.substr(propertyName.length - 1);
                      $scope.propertyName = "OFFER_0"+id+"_PRICE";
                    } else if (propertyName.indexOf("Self") > -1) {
                      $scope.propertyName = "OFFER_PRICE";
                    } else {
                      $scope.propertyName = propertyName;
                    }
                    console.log("orderBy "+$scope.propertyName);
                  };

                $scope.booleanTranslator = function(boolean) {
                  if(boolean == 0){
                    return "nope";
                  } else {
                    return "yep";
                  }
                }

                $scope.datalabels = [];

                $scope.processData = function(){
                  $scope.competitorPrices = {};
                  $scope.datalabels = [];
                  var i = 1;
                  for(;i<$scope.amountOfCompetitors; i++){

                    var id = "0"+i;

                    if($scope.bookData[0]["OFFER_"+id+"_PRICE"] > 0){
                      $scope.datalabels.push("Competitor " + id);

                      $scope.competitorPrices[i-1] = [];
                      for(var j=0; j<$scope.bookData.length; j++){
                          $scope.competitorPrices[i-1].push($scope.bookData[j]["OFFER_"+id+"_PRICE"]);
                      }
                    }
                  }
                  $scope.ownPrices = [];
                  for(var j=0; j<$scope.bookData.length; j++){
                      $scope.ownPrices.push($scope.bookData[j]["OFFER_PRICE"]);
                  }

                  $scope.drawGraph();
                }

                $scope.getRandomInt = function(min, max){
                  return Math.floor(Math.random() * (max - min + 1)) + min;
                }

                $scope.generateOffsetForGraph = function(){
                  var random_offset = $scope.getRandomInt(1, $scope.datalabels.length+1);
                  var involved_parties = $scope.datalabels.length+1;
                  return (random_offset/involved_parties);
                }

                $scope.drawGraph = function(){
                  var columns = [];
                  var y_axis = [];
                  var x_axis = [];

                  for (var i = 0; i < $scope.datalabels.length; i++) {
                    y_axis = [];
                    y_axis.push($scope.datalabels[i]);
                    y_axis = y_axis.concat($scope.competitorPrices[i]);
                    columns.push(y_axis);

                    x_axis = [];
                    var tmp = [];
                    x_axis.push($scope.datalabels[i]+"_x");
                    for (j = 0; j < $scope.competitorPrices[i].length; j++) {
                      tmp.push(j+$scope.generateOffsetForGraph());
                    }
                    x_axis = x_axis.concat(tmp);
                    columns.push(x_axis);
                  }
                  //adding own prices
                  tmp = [];
                  var self_y_axis = [];
                  self_y_axis.push("Self");
                  self_y_axis = self_y_axis.concat($scope.ownPrices);
                  columns.push(self_y_axis);

                  tmp.push("Self_x");
                  for (j = 0; j < $scope.competitorPrices[0].length; j++) {
                    tmp.push(j+$scope.generateOffsetForGraph());
                  }
                  columns.push(tmp);

                  var colors = {};
                  var types = {};
                  var x_axis_labels = [];

                  // Set colors and types
                  for (i = 0; i < $scope.datalabels.length; i++) {
                    var letters = '0123456789ABCDEF'.split('');
                    var color = '#';
                    for (var r = 0; r < 6; r++ ) {
                        color += letters[Math.floor(Math.random() * 16)];
                    }
                    colors[$scope.datalabels[i]] = color;
                    types[$scope.datalabels[i]] = 'step';
                    x_axis_labels[""+$scope.datalabels[i]] = $scope.datalabels[i]+"_x";
                  }
                  types["Self"] = 'step';
                  x_axis_labels["Self"] = "Self_x";

                  c3.generate({
                      bindto: '#lineChart',
                      data:{
                          columns: columns,
                          colors: colors,
                          types: types,
                          xs: x_axis_labels
                      },
                      point: {
                          show: false
                      },
                      axis: {
                          x: {
                              label: 'X Time',
                              tick: {
                                  fit: true,
                                  culling: {
                                      max: ($scope.datalabels.length+1) // the number of tick texts will be adjusted to less than this value
                                  }
                              }
                          },
                          y: {
                              label: 'Y Price'
                          }
                      },
                      line: {
                        step: {
                          type: 'step-after'
                        }
                      }
                  });
                  $("#loadingModal").modal("hide");
                  l.ladda('stop');
                }

        }] //END: controller function
    );  // END: detailsController
    de.controller('booksCtrl', ['$routeParams', '$location', '$http', '$scope', '$cookieStore', '$window', '$filter', '$rootScope', '$timeout',
            function ($routeParams, $location, $http, $scope, $cookieStore, $window, $filter, $rootScope, $timeout) {

                // Toastr options
                toastr.options = {
                    "debug": false,
                    "newestOnTop": false,
                    "positionClass": "toast-top-center",
                    "closeButton": true,
                    "toastClass": "animated fadeInDown",
                    "timeOut": "2000",
                };

                $scope.books = [];
                $http.get("/api/books", { cache: true}).then(function(response) {
                  angular.forEach(response.data, function(value, key){
                    $scope.books.push(value.ISBN);
                  });
                  //$scope.updateAPICache();
                });

                $scope.updateAPICache = function(){
                  var unsorted_books = $scope.shuffleArray($scope.books);
                  for(var i=0;i<100;i++){
                    $scope.getRemoteBookDetails(unsorted_books[i]);
                    i = i+1;
                  }
                }

                $scope.getRemoteBookDetails = function(isbn){
                  $http.get("http://isbn.hpi.framsteg.de/proxy/?api_key=1SA!dsaSAdoh23!s&isbn="+isbn, { cache: true}).then(function(response) {});
                }

                //Fisher-Yates Shuffle
                $scope.shuffleArray = function(array) {
                  var counter = array.length;
                  // While there are elements in the array
                  while (counter > 0) {
                      // Pick a random index
                      var index = Math.floor(Math.random() * counter);
                      // Decrease counter by 1
                      counter--;
                      // And swap the last element with it
                      var temp = array[counter];
                      array[counter] = array[index];
                      array[index] = temp;
                  }
                  return array;
                }
        }] //END: controller function
    );  // END: booksController
})(); //END: global function
