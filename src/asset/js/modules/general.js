(function () {
    var ana = angular.module('general', ['ngCookies']);

    ana.controller('ngviewController', ['$routeParams', '$location', '$http', '$scope', '$cookieStore',
        function ($routeParams, $location, $http, $scope, $cookieStore) {

            $scope.$on('$viewContentLoaded', function() {
                    //at_reload();
            });
        }] //END: controller function
    );  // END: ngviewController

    ana.controller('profitsimulationCtrl', ['$routeParams', '$location', '$http', '$scope', '$cookieStore',
        function ($routeParams, $location, $http, $scope, $cookieStore) {

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
          $scope.myprice = 1.08;
          $scope.myrank = 2;
          $scope.salesrank = 276672;
          $scope.isbn = "3426618230";
          $scope.myamount = 10;
          $scope.mydiscount = 0.9999;
          $scope.holdingCosts = 0.0002777;
          $scope.myquality = 4;
          $scope.myfeedback = 60000;
          $scope.myshipping = 2;

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
          });

          $scope.getPricingPolicy = function(){
            var querystring = '?';
            if ($scope.offset != null && $scope.to) {
                querystring += 'offset=' + $scope.offset + '&to='+ $scope.to
                              +'&isbn='+$scope.isbn +'&myAmount='+$scope.myamount
                              +'&discount='+$scope.mydiscount+'&holdingCosts='+$scope.holdingCosts;
            }
            $http.get("/api/calculatePotentialPricingStrategy/"+querystring, { cache: true}).then(function(response) {
                var self_y_axis = [];
                self_y_axis.push("New_Pricing_Strategy");
                self_y_axis = self_y_axis.concat(response.data);
                $scope.columns.push(self_y_axis);

                var tmp = [];
                tmp.push("New_Pricing_Strategy_x");
                for (j = 0; j < $scope.competitorPrices[0].length; j++) {
                  tmp.push(j+$scope.generateOffsetForGraph());
                }
                $scope.columns.push(tmp);

                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var r = 0; r < 6; r++ ) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                $scope.colors["New_Pricing_Strategy"] = color;
                $scope.types["New_Pricing_Strategy"] = 'step';
                $scope.x_axis_labels["New_Pricing_Strategy"] = "New_Pricing_Strategy_x"

                c3.generate({
                  bindto: '#lineChart',
                  data:{
                      columns: $scope.columns,
                      colors: $scope.colors,
                      types: $scope.types,
                      xs: $scope.x_axis_labels
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

            $scope.drawLineGraph();
            $scope.updateCompetitorSettings();
          }

          $scope.competitor = [];

          $scope.updateCompetitorSettings = function() {
            for(var j=1; j<$scope.datalabels.length+1; j++){
                $scope.competitor[j-1] = {};
                $scope.competitor[j-1].condition = $scope.bookData[0]["OFFER_0"+(j)+"_CONDITION"];
                $scope.competitor[j-1].price = parseFloat($scope.bookData[0]["OFFER_0"+(j)+"_PRICE"]);
                $scope.competitor[j-1].shipping = $scope.bookData[0]["OFFER_0"+(j)+"_SHIPPING"];
                $scope.competitor[j-1].is_prime = $scope.bookData[0]["OFFER_0"+(j)+"_IS_PRIME"];
                $scope.competitor[j-1].rating = $scope.bookData[0]["OFFER_0"+(j)+"_RATING"];
                $scope.competitor[j-1].feedback = $scope.bookData[0]["OFFER_0"+(j)+"_FEEDBACK"];
                $scope.competitor[j-1].quantity = $scope.bookData[0]["OFFER_0"+(j)+"_QUANTITY"];
                $scope.myquality = $scope.bookData[0]["OFFER_QUALITY"];
                $scope.myprice = parseFloat($scope.bookData[0]["OFFER_PRICE"]);
            }
          }

          $scope.getRandomInt = function(min, max){
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }

          $scope.generateOffsetForGraph = function(){
            var random_offset = $scope.getRandomInt(1, $scope.datalabels.length+1);
            var involved_parties = $scope.datalabels.length+1;
            return (random_offset/involved_parties);
          }

          $scope.columns = [];
          $scope.colors = {};
          $scope.types = {};
          $scope.x_axis_labels = [];
          $scope.drawLineGraph = function(){
            var y_axis = [];
            var x_axis = [];

            for (var i = 0; i < $scope.datalabels.length; i++) {
              y_axis = [];
              y_axis.push($scope.datalabels[i]);
              y_axis = y_axis.concat($scope.competitorPrices[i]);
              $scope.columns.push(y_axis);

              x_axis = [];
              var tmp = [];
              x_axis.push($scope.datalabels[i]+"_x");
              for (j = 0; j < $scope.competitorPrices[i].length; j++) {
                tmp.push(j+$scope.generateOffsetForGraph());
              }
              x_axis = x_axis.concat(tmp);
              $scope.columns.push(x_axis);
            }
            //adding own prices
            tmp = [];
            var self_y_axis = [];
            self_y_axis.push("Self");
            self_y_axis = self_y_axis.concat($scope.ownPrices);
            $scope.columns.push(self_y_axis);

            tmp.push("Self_x");
            for (j = 0; j < $scope.competitorPrices[0].length; j++) {
              tmp.push(j+$scope.generateOffsetForGraph());
            }
            $scope.columns.push(tmp);

            // Set colors and types
            for (i = 0; i < $scope.datalabels.length; i++) {
              var letters = '0123456789ABCDEF'.split('');
              var color = '#';
              for (var r = 0; r < 6; r++ ) {
                  color += letters[Math.floor(Math.random() * 16)];
              }
              $scope.colors[$scope.datalabels[i]] = color;
              $scope.types[$scope.datalabels[i]] = 'step';
              $scope.x_axis_labels[""+$scope.datalabels[i]] = $scope.datalabels[i]+"_x";
            }
            $scope.types["Self"] = 'step';
            $scope.x_axis_labels["Self"] = "Self_x";

            $scope.chart = c3.generate({
                bindto: '#lineChart',
                data:{
                    columns: $scope.columns,
                    colors: $scope.colors,
                    types: $scope.types,
                    xs: $scope.x_axis_labels
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
            //uncomment the following line if New Pricing Policy shall be visualized
            //$scope.getPricingPolicy();
          }

          $scope.sellingProbability = function(){
            var body = {
              "competitors": $scope.competitor,
              "self":{
                "quality": $scope.myquality,
                "feedback": $scope.myfeedback,
                "shipping": $scope.myshipping,
                "amount": $scope.myamount,
                "rank": $scope.myrank,
                "discount": $scope.mydiscount,
                "holdingCosts": $scope.holdingCosts,
                "price": $scope.myprice,
              }
            };

            $http({url: "/api/sellingProbability/",
                  dataType: "json",
                  method: "POST",
                  data: body,
                  headers: {
                      "Content-Type": "application/json"
                  }
                }).success(function (data) {
                        $scope.sellingProbabilityScore = Math.round((data*100)*100)/100;
                        $scope.drawGaugeGraph();
                });
          }

          $scope.simulateSituation = function(){
            toastr.success("Calculating..");
            $scope.sellingProbability();
            $scope.calculateProfit();
          }

          $scope.calculateProfit = function(){

            var body = {
              "competitors": $scope.competitor,
              "self":{
                "quality": $scope.myquality,
                "feedback": $scope.myfeedback,
                "shipping": $scope.myshipping,
                "amount": $scope.myamount,
                "rank": $scope.myrank,
                "discount": $scope.mydiscount,
                "holdingCosts": $scope.holdingCosts,
                "price": $scope.myprice,
              }
            };

            $http({url: "/api/calculateProfit/",
                  dataType: "json",
                  method: "POST",
                  data: body,
                  headers: {
                      "Content-Type": "application/json"
                  }
                }).success(function (data) {
                        $scope.profit = data; //round to second digit
                });
          }

          $scope.drawGaugeGraph = function() {

                var chart = c3.generate({
                  bindto: '#gaugeChart',
                  data: {
                      columns: [
                          ['data', $scope.sellingProbabilityScore]
                      ],
                      type: 'gauge',
                      onclick: function (d, i) { console.log("onclick", d, i); },
                      onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                      onmouseout: function (d, i) { console.log("onmouseout", d, i); }
                  },
              //    gauge: {
              //        label: {
              //            format: function(value, ratio) {
              //                return value;
              //        },
              //            show: false // to turn off the min/max labels.
              //        },
              //    min: 0, // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
              //    max: 100, // 100 is default
              //    units: ' %',
              //    width: 39 // for adjusting arc thickness
              //  },
                  color: {
                      pattern: ['#FF0000', '#F97600', '#F6C600', '#60B044'], // the three color levels for the percentage values.
                      threshold: {
              //            unit: 'value', // percentage is default
              //            max: 200, // 100 is default
                          values: [30, 60, 90, 100]
                      }
                  },
                  size: {
                      height: 180
                  }
              });
          }


          $scope.getBookData();

        }] //END: controller function
    );  // END: profitsimulationCtrl
})(); //END: global function
