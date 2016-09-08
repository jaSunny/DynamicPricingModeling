// Constants
var Server_URL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');

(function () {
    // vars defining the URIs of the REST-APIs
    var frontend = angular.module('frontend', [
        'ngRoute',
        'chart.js',
        'dashboard',
        'general',
        'details',
        ]);

    frontend.config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.
                // Common Views
                when('/dashboard', {
                    templateUrl: 'asset/templates/dashboard.html',
                    controller: 'dashboardCtrl',
                    reloadOnSearch: true
                }).
                when('/boardroom', {
                    templateUrl: 'asset/templates/boardroom.html',
                    controller: 'boardroomCtrl'
                }).
                when('/books', {
                    templateUrl: 'asset/templates/books.html',
                    controller: 'booksCtrl'
                }).
                when('/details/:id', {
                    templateUrl: 'asset/templates/details.html',
                    controller: 'detailsCtrl'
                }).
                when('/profit-simulation', {
                    templateUrl: 'asset/templates/profit_simulation.html',
                    controller: 'profitsimulationCtrl'
                }).
                // default Route
                otherwise({
                    redirectTo: '/dashboard'
                });
        }
    ]);
})();
