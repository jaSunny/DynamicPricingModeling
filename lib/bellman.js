module.exports = {
  exec: best_discounted_profit,
  profit: profit,
  profit_api: profit_api,
  probability_to_sell: probability_to_sell
}
const BETAS = [
  -5.165234215,     // Intercept
  -0.033400407,     // Dif to min
  0.016765853,      // Dif to median
  -0.006796492,     // Price density
  -0.677872620      // Price rank
]

// const BETAS = [
//   -2.576,         // Intercept
//   -0.1881,        // Dif to min
//   -0,01358,       // Dif to median
//   -0.001705,      // Price density
//   -0.06668,       // Price rank
//   -1.291,         // Log Price rank
//   -0.000001491,   // Sales rank
//   -0.2591,        // Psychological price
//   0.006086,       // Quality rank
//   -0.08655,       // Feedback rank
//   -0.09823,       // Rating rank
//   0.2052,         // Shipping rank
//   -0.5048,        // Log quality rank
//   0.3198,         // Log Feedback rank
//   -0.007703,      // Log Rating rank
//   -0.6733,        // Log shipping rank
//   -0.4322,        // Offer quality
//   -0.07475,       // Offer totals count
//   0.1573          // Offers used count
// ]
const INTERCEPT = 0;
const DIFF_TO_MIN = 1;
const DIFF_TO_MEDIAN = 2;
const PRICE_DENSITY = 3;
const PRICE_RANK = 4;
const LOG_PRICE_RANK = 5;
const SALES_RANK = 6;
const PSYCHOLOGICAL_PRICE = 7;
const QUALITY_RANK = 8;
const FEEDBACK_RANK = 9;
const RATING_RANK = 10;
const SHIPPING_RANK = 11;
const LOG_QUALITY_RANK = 12;
const LOG_FEEDBACK_RANK = 13;
const LOG_RATING_RANK = 14;
const LOG_SHIPPING_RANK = 15;
const OFFER_QUALITY = 16;
const OFFER_TOTALS_COUNT = 17;
const OFFER_USED_COUNT = 18;

const PRICE_TOP = 100;
const PRICE_INTERVAL = 0.1;

var DISCOUNT = 0.99;
var HOLDING_COSTS = 0.0002777;

var self = {
  quality: 1,
  feedback: 60000,
  shipping: 2
}

//Caches
var discounted_profit_cache = []

// Calc best discounted profit with cache
function profit(number_of_items, competitors) {
  for(var i=0; i<=number_of_items; i++){
    var profit = best_discounted_profit(i, competitors)
    discounted_profit_cache.push(profit)
  }
  return discounted_profit_cache[number_of_items]
}

/*
* number_of_items   denoted as    i
* competitors       denoted ad    s
*/
function best_discounted_profit(number_of_items, competitors) {
  // console.log(Array(rek).join('\t'), "Discounted profit for: ",  number_of_items)
  var result = [];
  var price = 0

  //Check for already existing cache entry for this number of items
  if(discounted_profit_cache.length >= number_of_items+1){
    return discounted_profit_cache[number_of_items]
  }else{
    while (price <= PRICE_TOP) {
      var today = todays_profit(number_of_items, price, HOLDING_COSTS, competitors)
      var future = future_profit(number_of_items, price, competitors)
      var btm = 1 - DISCOUNT * probability_to_sell(0, price, competitors)

      var discounted_profit =
        (
          today + //todays_profit(number_of_items, price, HOLDING_COSTS, competitors) +
          future //future_profit(number_of_items, price, competitors)
        ) /
        (
          btm // 1 - DISCOUNT * probability_to_sell(0, price, competitors)
        )

      result.push(discounted_profit)
      price = price + PRICE_INTERVAL;
    }
  }

  return result.indexOf( Math.max.apply(Math, result) ) * PRICE_INTERVAL;
}

/*
* number_of_items   denoted as    i
* price             denoted as    a
* holding_costs     denoted as    l
* competitors       denoted ad    s
*/
function todays_profit(number_of_items, price, holding_costs, competitors) {
  var result=0;
  var left_items = 0;
  while (left_items <= number_of_items) {
    result =+ probability_to_sell(left_items, price, competitors) *
              (Math.min(number_of_items, left_items) * price - number_of_items * holding_costs);
    left_items++;
  }
  return result;
}

/*
* number_of_items   denoted as    i
* price             denoted as    a
* competitors       denoted ad    s
*/
function future_profit(number_of_items, price, competitors) {
  //console.log("Input: #"+number_of_items+" "+price+"€ "+competitors)
  var result = 0;
  var left_items = 1;
  while (left_items <= number_of_items) {
    result =+ probability_to_sell(left_items, price, competitors) *
              DISCOUNT *
              best_discounted_profit(left_items - 1, competitors);
    left_items++;
  }
  return result;
}

/*
number_of_items usually noted as i
price as float
state is a vector (Array) of all competitor prices
*/
function probability_to_sell(number_of_items, price, state) {
  var probability = 1
  // for (var i = 0; i < number_of_items; i++) {
    // probability = probability *
    //               (BETAS[INTERCEPT] +
    //                BETAS[PRICE_RANK] * rank(price, state))
  // }
  probability = (BETAS[INTERCEPT] +
                 BETAS[PRICE_RANK]          * rank(price, state, 'price') +
                 BETAS[DIFF_TO_MIN]         * diff_to_min(price, state) +
                 BETAS[PRICE_DENSITY]       * standard_deviation(price, state) +
                 BETAS[DIFF_TO_MEDIAN]      * diff_to_median(price, state) )
                //  BETAS[LOG_QUALITY_RANK]    * Math.log ( rank(self.quality, state, 'quality') ) +
                //  BETAS[LOG_SHIPPING_RANK]   * Math.log ( rank(self.shipping, state, 'shipping') ) +
                //  BETAS[LOG_FEEDBACK_RANK]   * Math.log ( rank(self.feedback, state, 'feedback') ))

  logistic_regresseion = 1 / ( 1 + Math.exp( (-1) * probability) )

  return logistic_regresseion
}
function rank_inversed(price, state) {
  var r = 0;
  for (var i = 0; i < state.length; i++) {
    if (price <= state[i].price)
      r++;
  }
  return r;
}
function rank(price, state, attr) {
  var r = 1;
  for (var i = 0; i < state.length; i++) {
    if (price >= state[i][attr])
      r++;
  }
  return r;
}
function diff_to_min(price, state) {
  var min = price;
  for (var i = 0; i < state.length; i++) {
    if (min > state[i].price)
      min = state[i].price;
  }
  return price-min;
}
function diff_to_median(price, state) {
  state = state.map(function(competitor){return competitor.price})
  var values = state.concat([price]);
  values.sort((a, b) => a - b);
  var lowMiddle = Math.floor((values.length - 1) / 2);
  var highMiddle = Math.ceil((values.length - 1) / 2);
  var median = (values[lowMiddle] + values[highMiddle]) / 2;

  return Math.abs(price-median);
}
function standard_deviation(price, state){
  state = state.map(function(competitor){return competitor.price})
  var values = state.concat([price]);
  var avg = average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}
function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function profit_api(new_self, competitors) {
  self = new_self
  if(self.discount)
    DISCOUNT = self.discount;
  if(self.holdingCost)
    HOLDING_COSTS = self.holdingCost;
  return profit(self.amount, competitors);
}

var start = Date.now()
//console.log(
//  profit(10, [
//    {
//      price: 10.4,
//      quality: 4,
//      feedback: 600000,
//      shipping: 1
//    },
//    {
//      price: 12.5,
//      quality: 2,
//      feedback: 500000,
//      shipping: 1
//    },
//    {
//      price: 13,
//      quality: 4,
//      feedback: 6000,
//      shipping: 2
//    },
//    {
//      price: 7.4,
//      quality: 5,
//      feedback: 50000,
//      shipping: 4
//    },
//    {
//      price: 16.6,
//      quality: 1,
//      feedback: 100000,
//      shipping: 1
//    }
//  ]) + ' €'
//)

console.log(Date.now()-start + " ms")

// console.log(rank(10, [
//     {
//       price: 10
//     },
//     {
//       price: 12.5
//     },
//     {
//       price: 13
//     },
//     {
//       price: 15.4
//     },
//     {
//       price: 16.6
//     }
//   ], 'price'))
