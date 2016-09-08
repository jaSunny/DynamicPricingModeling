(function () {
    var da = angular.module('dashboard', ['ngCookies']);

    da.controller('dashboardCtrl', ['$routeParams', '$location', '$http', '$scope', '$cookieStore', '$window', '$filter', '$rootScope',
            function ($routeParams, $location, $http, $scope, $cookieStore, $window, $filter, $rootScope) {

            }] //END: controller function
    );  // END: dashboardController

    da.controller('boardroomCtrl', ['$routeParams', '$location', '$http', '$scope', '$cookieStore', '$window', '$filter', '$rootScope',
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
              $scope.to = 1;
              $scope.amountOfCompetitors = 5;
              $scope.myprice = 0;
              $scope.myrank = 2;
              $scope.salesrank = 276672;
              $scope.isbn = "3426618230";
              $scope.myamount = 10;
              $scope.mydiscount = 0.99;
              $scope.holdingCosts = 0.0002777;
              $scope.amounOfBooksForSimulation = 100;
              $scope.percentageOfBooksToBeSold = 100;
              $scope.stepsSkipped = 20;

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

              $scope.books = [];
              $http.get("/api/books",{ cache: true}).then(function(response) {
                angular.forEach(response.data, function(value, key){
                  $scope.books.push(value.ISBN);
                });
                $scope.getGraphData();
              });

              $scope.getGraphData = function(){
                 $("#loadingModal").modal("show");
                 $http.get("/api/getBooksWithDetails?limit="+$scope.amounOfBooksForSimulation
                                                  +"&myPrice="+$scope.myprice
                                                  +"&myAmount="+$scope.myamount
                                                  +"&amountOfCompetitors="+$scope.amountOfCompetitors
                                                  +"&percentageOfBooksToBeSold="+$scope.percentageOfBooksToBeSold
                                                  +"&isbn_details=true"
                                                  +"&stepsSkipped="+$scope.stepsSkipped
                                                  ,{ cache: true}).then(function(response) {
                  $scope.bookData = response.data;
                  $scope.processData();
                });
              }

              $scope.becomeSpecific = function(isbn){
                //$scope.getSpecificGraphData(isbn);
                $scope.drawLineGraphISBN(isbn);
              }

              $scope.getSpecificGraphData = function(isbn){
                 $("#loadingModal").modal("show");
                 $http.get("/api/getSpecificBookWithDetails?limit="+$scope.amounOfBooksForSimulation
                                                  +"&myPrice="+$scope.myprice
                                                  +"&myAmount="+$scope.myamount
                                                  +"&amountOfCompetitors="+$scope.amountOfCompetitors
                                                  +"&percentageOfBooksToBeSold="+$scope.percentageOfBooksToBeSold
                                                  +"&isbn="+isbn
                                                  +"&stepsSkipped="+$scope.stepsSkipped
                                                  ,{ cache: true}).then(function(response) {
                  $scope.test = response.data;
                  //$scope.processData();
                  $scope.drawLineGraphISBN(isbn);
                });
              }

              $scope.updateBookDataModel = function(){
                $("#loadingModal").modal("show");
                $http({url: "/api/getBooksWithDetails?limit="+$scope.amounOfBooksForSimulation
                                                    +"&amountOfCompetitors="+$scope.amountOfCompetitors
                                                    +"&percentageOfBooksToBeSold="+$scope.percentageOfBooksToBeSold
                                                    +"&offset="+$scope.offset
                                                    +"&to="+$scope.to
                                                    +"&stepsSkipped="+$scope.stepsSkipped,
                      dataType: "json",
                      method: "POST",
                      data: $scope.bookData,
                      headers: {
                          "Content-Type": "application/json"
                      }
                    }).success(function (data) {
                      $scope.bookData = data;
                      $scope.processData();
                    });
              }

              var l = $( '.ladda-button-demo' ).ladda();
              l.click(function(){
                  $("#loadingModal").modal("show");
                  //l.ladda( 'start' );
                  //$scope.getBookData();
              });
              //$("#loadingModal").modal("show");
              //l.ladda( 'start' );

              $scope.datalabels = [];

              $scope.processData = function(){
                $scope.competitorPrices = {};
                $scope.datalabels = [];

                for(var i=1;i<$scope.bookData["total"]["competitor_count"];i++){
                  $scope.datalabels.push("Competitor 0"+i)
                }

                $scope.drawLineGraph();
              }

              $scope.drawLineGraph = function(){
                var columns = [];
                var y_axis = [];
                y_axis.push("Potential Profit");
                var tmp = $scope.bookData["total"]["potential_profit"];
                var left_over = ($scope.bookData["total"]["current_profit"].length - $scope.bookData["total"]["potential_profit"].length);
                for(var i=1; i<left_over;i++){
                  tmp.push($scope.bookData["total"]["potential_profit"][$scope.bookData["total"]["potential_profit"].length-1]);
                }
                y_axis = y_axis.concat(tmp);
                columns.push(y_axis);

                y_axis = [];
                y_axis.push("Current Profit");
                y_axis = y_axis.concat($scope.bookData["total"]["current_profit"]);
                columns.push(y_axis);

                c3.generate({
                    bindto: '#lineChart',
                    data: {
                        columns: columns
                    },
                    point: {
                        show: false
                    },
                    axis: {
                        x: {
                            label: 'X Time'
                        },
                        y: {
                            label: 'Y Profit'
                        }
                    }
                });
                $("#loadingModal").modal("hide");
                l.ladda('stop');
              }

              $scope.drawLineGraphISBN = function(isbn){
                  var columns = [];
                  var y_axis = [];

                  y_axis.push("Potential Profit");
                  var tmp = []; count = 0;
                  angular.forEach($scope.bookData["total"]["potential_profit_details"][""+isbn]["profit"], function(value, key){
                    if(value != 0){
                      count = count +value;
                      tmp.push(count);
                    }
                  });
                  var left_over = ($scope.bookData["total"]["current_profit_details"].length - $scope.bookData["total"]["potential_profit_details"].length);
                  for(var i=1; i<left_over;i++){
                    tmp.push($scope.bookData["total"]["potential_profit_details"][$scope.bookData["total"]["potential_profit_details"].length-1]);
                  }
                  y_axis = y_axis.concat(tmp);
                  columns.push(y_axis);

                  y_axis = []; tmp = []; count = 0;
                  y_axis.push("Current Profit");
                  angular.forEach($scope.bookData["total"]["current_profit_details"][""+isbn]["profit"], function(value, key){
                    if(value != 0){
                      count = count +value;
                      tmp.push(count);
                    }
                  });
                  y_axis = y_axis.concat(tmp);
                  columns.push(y_axis);

                  c3.generate({
                      bindto: '#lineChartIsbn',
                      data: {
                          columns: columns
                      },
                      point: {
                          show: false
                      },
                      axis: {
                          x: {
                              label: 'X Time'
                          },
                          y: {
                              label: 'Y Profit'
                          }
                      }
                  });
              }

            }] //END: controller function
    );  // END: boardroomCtrl
})(); //END: global function
