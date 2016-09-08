'use strict';

const data    = require(__dirname + "/data.js")
const db      = require('./db')
const bellman = require('./bellman')
const router  = module.exports = require('express').Router();
const q       = require('q')

module.exports = {
  build_payload: build_payload,
  update_payload_for_existing_result: update_payload_for_existing_result,
  build_payload_for_specific_book: build_payload_for_specific_book
}

function build_query_for_distinct_isbn(limit){
  return "SELECT DISTINCT ISBN10 as isbn FROM (SELECT * FROM PRICING_SEMINAR.OBSERVATIONS WHERE SOLD_YN<>0) LIMIT "+limit;
}

function build_query_for_specific_isbn_details(bookId, offset, to){
  var query = "",
      limit = (to - offset);

  return " (SELECT * FROM PRICING_SEMINAR.OBSERVATIONS WHERE ISBN10='"+bookId+"' ORDER BY DATUM_UHRZEIT_VON LIMIT "+limit+" OFFSET "+offset+") ";
}

function build_query_for_isbn_details(bookIds, offset, to){
  var query = "",
      limit = (to - offset);

  //creating nested SQL query via union to get for each isbn one record
  for(var i=0;i<bookIds.length;i++) {
    if(!(i==0)) { query = query + " union "; }
    query = query + " (SELECT * FROM PRICING_SEMINAR.OBSERVATIONS WHERE ISBN10='"+bookIds[i]+"' ORDER BY DATUM_UHRZEIT_VON LIMIT "+limit+" OFFSET "+offset+") ";
  }
  return query;
}

function create_books_array(HanaObject){
  var bookIds = [];
  HanaObject.forEach(function(item) {
    bookIds.push(item.ISBN);
  });
  return bookIds;
}

function add_competitor_details_for_isbn(item, result, isbn){
  var tmp;

  for(var i=1;i<8;i++) {
    if( item["OFFER_0"+i+"_PRICE"] === 0.00){ break; }
    tmp = {
        price: parseFloat(item["OFFER_0"+i+"_PRICE"]),
        feedback: item["OFFER_0"+i+"_FEEDBACK"],
        shipping: item["OFFER_0"+i+"_SHIPPING"],
        condition: item["OFFER_0"+i+"_CONDITION"],
        is_prime: item["OFFER_0"+i+"_IS_PRIME"],
        rating: item["OFFER_0"+i+"_RATING"],
        quantity: item["OFFER_0"+i+"_QUANTITY"]
      };
      result[isbn]["competitors"].push(tmp);
  }
  result[isbn]["competitors_amount"] = i-1;
  result["total"]["competitor_count"] = i;
  return result;
}

function get_myAmount(req){
  if(typeof req.query.myAmount !== 'undefined' && req.query.myAmount && req.query.myAmount != 0) {
    return parseInt(req.query.myAmount);
  } else {
    return 1;
  }
}

function get_myPrice(req, item){
  if(typeof req.query.myPrice !== 'undefined' && req.query.myPrice && req.query.myPrice != 0) {
    return req.query.myPrice;
  } else {
    return parseFloat(item["OFFER_PRICE"]);
  }
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

function get_stepsSkipped(req){
  if(typeof req.query.stepsSkipped !== 'undefined' && req.query.stepsSkipped) {
   return parseInt(req.query.stepsSkipped);
  } else {
   return 20;
  }
}

function get_isbn(req){
  if(typeof req.query.isbn !== 'undefined' && req.query.isbn) {
   return req.query.isbn;
  } else {
   return "3426618230";
  }
}

function get_offset(req){
  if(typeof req.query.offset !== 'undefined' && req.query.offset) {
   return req.query.offset;
  } else {
   return 0;
  }
}

function get_random_number(){
  //return random_number = Math.floor(Math.random() * (max - min)) + min; // for non-uniform distribution
  return Math.random(); //for uniform distribution
}

function get_sold_books_threshold(req){
  if(typeof req.query.percentageOfBooksToBeSold !== 'undefined' && req.query.percentageOfBooksToBeSold && req.query.percentageOfBooksToBeSold != 0){
    return req.query.percentageOfBooksToBeSold;
  } else {
    return 100;
  }
}

function get_competitors(req, result, isbn){
  if(typeof req.query.amountOfCompetitors !== 'undefined' && req.query.amountOfCompetitors && req.query.amountOfCompetitors != 0){
    var max_competitor_count = req.query.amountOfCompetitors;
    return result[isbn]["competitors"].slice(0, max_competitor_count)
  } else {
    return result[isbn]["competitors"]
  }
}

function build_result_object(HanaObject, req){
  var result = {},
      longest_profit_timline = "";
  result["total"] = {};

  HanaObject.forEach(function(item, index) {
    var isbn = item.ISBN10;
    result[isbn] = {};
    result[isbn]["competitors"] = [];

    if(typeof req.query.raw !== 'undefined' && req.query.raw) { result[isbn]["raw"] = item; }

    result = add_competitor_details_for_isbn(item, result, isbn);

    var myAmount = get_myAmount(req),
        myPrice = get_myPrice(req, item),
        competitors = get_competitors(req, result, isbn);

    result[isbn]["Self"] = {};
    result[isbn]["Self"]["price"] = myPrice;
    result[isbn]["Self"]["amount"] = myAmount;
    result[isbn]["future_profit"] =  bellman.profit(myAmount,competitors);

    if(index == 0){
      longest_profit_timline = ""+isbn;
    }
    if(result[isbn]["future_profit"].length > result[longest_profit_timline]["future_profit"].length){
      longest_profit_timline = ""+result[isbn];
    }
  });
  return result;
}

function merge_objects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function calculate_future_profit(bookIds, result){
  var future_profit_sum = 0;
  bookIds.forEach(function(bookid) {
    future_profit_sum = future_profit_sum + result[""+bookid]["future_profit"];
  });
  return future_profit_sum;
}

function get_min_sell_threshold(real_profit_run_through,sold_books_threshold,bookid){
  return (real_profit_run_through[""+bookid]["original_amount"] - real_profit_run_through[""+bookid]["original_amount"]*sold_books_threshold/100);
}

function simulate_run_through_for_profit(bookIds, result, sold_books_threshold, use_bellman_price){
  var probability,
      random_number,
      profit_run_through = {},
      sold_out_item_count=0,
      longest_sold_out_timeline,
      real_profit_run_through_sum=[],
      myPrice,
      myAmountLeft,
      competitors;

  // preparation loop
  bookIds.forEach(function(bookid) {
    profit_run_through[""+bookid] = {}
    profit_run_through[""+bookid]["profit"] = [];
    profit_run_through[""+bookid]["original_amount"] = result[""+bookid]["Self"]["amount"];
    profit_run_through[""+bookid]["amount_count"] = result[""+bookid]["Self"]["amount"];
  });

  //as long as not all items are sold, we iterate through all isbns and for each
  //time series, we calculate the selling probability and if we sell we reduce
  //the book amount by one
  // profit = probability * price (Self)
  while(!(sold_out_item_count === bookIds.length)){
    random_number = get_random_number(); //with uniform distribution

    bookIds.forEach(function(bookid, index) {
      myAmountLeft = profit_run_through[""+bookid]["amount_count"];
      competitors = result[""+bookid]["competitors"];
      if(use_bellman_price){
        myPrice = bellman.profit(myAmountLeft, competitors);
      } else {
        myPrice = result[""+bookid]["Self"]["price"];
      }
      if(myAmountLeft <= get_min_sell_threshold(profit_run_through,sold_books_threshold,bookid)){ return; }
      probability = 100*bellman.probability_to_sell(myAmountLeft, myPrice, competitors);
      //console.log("probability "+random_number+"/"+probability)
      if(random_number < probability){
        //profit_run_through[""+bookid]["profit"].push((probability * myPrice));
        profit_run_through[""+bookid]["profit"].push(myPrice);
        profit_run_through[""+bookid]["amount_count"]--;
        if(profit_run_through[""+bookid]["amount_count"] <= get_min_sell_threshold(profit_run_through,sold_books_threshold,bookid)) {
          sold_out_item_count++;
          //console.log("Sold out: "+sold_out_item_count+"/"+bookIds.length);
          if(typeof longest_sold_out_timeline === 'undefined'){
            longest_sold_out_timeline = ""+bookid;
          } else if(profit_run_through[""+bookid]["profit"].length > profit_run_through[longest_sold_out_timeline]["profit"].length){
            longest_sold_out_timeline = ""+bookid;
          }
        }
      } else {
        profit_run_through[""+bookid]["profit"].push(0);
      }
    });
  }
  return {profit_run_through: profit_run_through, longest_sold_out_timeline: longest_sold_out_timeline};
}

function sum_up_profit(profit_run_through, longest_sold_out_timeline, bookIds, stepsSkipped){
  var tmp=0,
      profit_run_through_sum=[];
  // adding up profits for each isbn in one time series
  for(var o=0;o<profit_run_through[""+longest_sold_out_timeline]["profit"].length; o++){
    bookIds.forEach(function(bookid, index) {
      if(typeof profit_run_through[""+bookid]["profit"][o] !== "undefined"){
        tmp = tmp +profit_run_through[""+bookid]["profit"][o];
      }
    });
    if(o % stepsSkipped === 0){
      profit_run_through_sum.push(tmp);
    }
  }
  return profit_run_through_sum;
}

function get_actual_average_item_price(result){
  return (result["total"]["real_profit"] / result["total"]["bookIds"].length);
}

function get_potential_average_item_price(result){
  (result["total"]["potential_profit"][result["total"]["potential_profit"].length-1] / result["total"]["bookIds"].length);
}

function expanding_result_model_with_generalized_data(result,req){
  var stepsSkipped = get_stepsSkipped(req);

  //result["total"]["potential_profit"] = calculate_future_profit(result["total"]["bookIds"], result);

  var sold_books_threshold = get_sold_books_threshold(req),
      current_profit = simulate_run_through_for_profit(result["total"]["bookIds"], result, sold_books_threshold, false),
      potential_profit = simulate_run_through_for_profit(result["total"]["bookIds"], result, sold_books_threshold, true);

  result["total"]["current_profit_details"] = current_profit["profit_run_through"];
  result["total"]["current_profit"] = sum_up_profit(current_profit["profit_run_through"], current_profit["longest_sold_out_timeline"], result["total"]["bookIds"], stepsSkipped);

  result["total"]["potential_profit_details"] = potential_profit["profit_run_through"];
  result["total"]["potential_profit"] = sum_up_profit(potential_profit["profit_run_through"], potential_profit["longest_sold_out_timeline"], result["total"]["bookIds"], stepsSkipped);

  //result["total"]["actual_average_item_price"] = get_actual_average_item_price(result);
  //result["total"]["potential_average_item_price"] = get_potential_average_item_price(result);
  return result;
}

function build_payload(req) {
  const deferred = q.defer();
  var limit = get_limit(req),
      offset = get_offset(req),
      to = get_to(req);

  db.exec(build_query_for_distinct_isbn(limit), (err, rows) => {
      if (err) {
          console.log(err);
          deferred.reject(err);
      } else {
          const responseArray = rows;
          var bookIds = create_books_array(responseArray),
              bookData = {};

          db.exec(build_query_for_isbn_details(bookIds, offset, to), (err2, rows2) => {
              if (err2) {
                  console.log(err2);
                  deferred.reject(err2);
              } else {
                  const responseArray2 = rows2;
                  var result = build_result_object(responseArray2, req);
                  result["total"]["bookIds"] = bookIds;

                  result = expanding_result_model_with_generalized_data(result,req);

                  if(!(typeof req.query.isbn_details !== 'undefined' && req.query.isbn_details)) {
                    result["total"]["bookIds"].forEach(function(isbn, index) {
                      delete result[""+isbn]
                    });
                    delete result["total"]["current_profit_details"];
                    delete result["total"]["potential_profit_details"];
                  }
                  deferred.resolve(result);
              }
          });
      }
  });
  return deferred.promise;
}

function update_amount_price_for_items(req,result){
  if(typeof req.query.myPrice !== 'undefined' && req.query.myPrice && req.query.myPrice != 0) {
    result["total"]["bookIds"].forEach(function(isbn, index) {
      result[""+isbn]["Self"]["price"] = req.query.myPrice;
    });
  }
  if(typeof req.query.myAmount !== 'undefined' && req.query.myAmount && req.query.myAmount != 0) {
    result["total"]["bookIds"].forEach(function(isbn, index) {
      result[""+isbn]["Self"]["amount"] = parseInt(req.query.myAmount);
    });
  }
  return result;
}

function update_payload_for_existing_result(req, result){
  var longest_profit_timline = "";
  result = update_amount_price_for_items(req,result);
  result.total.bookIds.forEach(function(isbn, index) {

  	var competitors = get_competitors(req, result, isbn);
    result[isbn]["future_profit"] =  bellman.profit(result[isbn]["Self"]["amount"],competitors);

		if(index == 0){
			longest_profit_timline = ""+isbn;
		}
		if(result[isbn]["future_profit"].length > result[longest_profit_timline]["future_profit"].length){
			longest_profit_timline = ""+result[isbn];
		}
	});
  result = expanding_result_model_with_generalized_data(result,req);

  return result;
}

function build_payload_for_specific_book(req){
  const deferred = q.defer();
  var limit = get_limit(req),
      offset = get_offset(req),
      to = get_to(req);
      isbn = get_isbn(req);

      db.exec(build_query_for_specific_isbn_details(isbn, offset, to), (err2, rows2) => {
          if (err) {
              console.log(err);
              deferred.reject(err);
          } else {
              const responseArray = rows;
              var result = build_result_object(responseArray, req);

              deferred.resolve(result);
          }
      });
  return deferred.promise;
}
