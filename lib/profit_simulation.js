'use strict';

const data    = require(__dirname + "/data.js")
const db      = require('./db')
const bellman = require('./bellman')
const router  = module.exports = require('express').Router();
const q       = require('q')

module.exports = {
  simulate_potential_profit: simulate_potential_profit
}

function build_query_for_isbn_details(isbn, offset, to){
  var query = "",
      limit = (to - offset);

  return " (SELECT * FROM PRICING_SEMINAR.OBSERVATIONS WHERE ISBN10='"+isbn+"' ORDER BY DATUM_UHRZEIT_VON LIMIT "+limit+" OFFSET "+offset+") ";
}

function get_limit(req){
  if(typeof req.query.limit !== 'undefined' && req.query.limit) {
   return req.query.limit;
  } else {
   return 10000;
  }
}

function get_to(req){
  if(typeof req.query.to !== 'undefined' && req.query.to) {
   return req.query.to;
  } else {
   return 1;
  }
}

function get_offset(req){
  if(typeof req.query.offset !== 'undefined' && req.query.offset) {
   return req.query.offset;
  } else {
   return 0;
  }
}

function get_myAmount(req){
  if(typeof req.query.myAmount !== 'undefined' && req.query.myAmount && req.query.myAmount != 0) {
    return parseInt(req.query.myAmount);
  } else {
    return 1;
  }
}

function get_discount(req){
  if(typeof req.query.discount !== 'undefined' && req.query.discount && req.query.discount != 0) {
    return parseFloat(req.query.discount);
  } else {
    return 0.99;
  }
}

function get_holding_costs(req){
  if(typeof req.query.holdingCosts !== 'undefined' && req.query.holdingCosts && req.query.holdingCosts != 0) {
    return parseFloat(req.query.holdingCosts);
  } else {
    return 0.0002777;
  }
}

function simulate_potential_profit(req){
  const deferred   = q.defer();
  var offset       = get_offset(req),
      to           = get_to(req),
      myAmount     = get_myAmount(req),
      discount     = get_discount(req),
      holdingCosts = get_holding_costs(req);

      db.exec(build_query_for_isbn_details(req.query.isbn, offset, to), (err2, rows2) => {
          if (err2) {
              console.log(err2);
              deferred.reject(err2);
          } else {
              const responseArray2 = rows2;
              var result = [],
                  competitors = [],
                  competitor = {},
                  self = {};

              responseArray2.forEach(function(item) {
                competitors = [];
                for(var i=1;i<8;i++) {
                  if( item["OFFER_0"+i+"_PRICE"] === 0.00){ break; }
                  competitor = {
                      price: parseFloat(item["OFFER_0"+i+"_PRICE"]),
                      feedback: item["OFFER_0"+i+"_FEEDBACK"],
                      shipping: item["OFFER_0"+i+"_SHIPPING"],
                      condition: item["OFFER_0"+i+"_CONDITION"],
                      is_prime: item["OFFER_0"+i+"_IS_PRIME"],
                      rating: item["OFFER_0"+i+"_RATING"],
                      quantity: item["OFFER_0"+i+"_QUANTITY"]
                    };
                    competitors.push(competitor);
                }
                self = {
                  quality: item["OFFER_QUALITY"],
                  //feedback: item["OFFER_FEEDBACK"],
                  //shipping: item["OFFER_SHIPPING"],
                  feedback: 60000,
                  shipping: 2,
                  amount: myAmount,
                  discount: discount,
                  holdingCost: holdingCosts
                };
                result.push(bellman.profit_api(self, competitors));
              });
              console.log("Entries Simulated: "+responseArray2.length);
              deferred.resolve(result);
          }
      });
  return deferred.promise;
}
