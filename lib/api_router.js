'use strict';

const data    					= require(__dirname + "/data.js")
const db 						= require('./db')
const bellman 					= require('./bellman')
const boardroom 				= require('./boardroom')
const profit_simulation 		= require('./profit_simulation')
const router 					= module.exports = require('express').Router();
const q       					= require('q')

//Routes
const books 					= require( __dirname + '/routes/books.js' )

/*
* All paths defined here are prepended by '/api'
*/
router.post('/getBooksWithDetails', (req, res) => {
	if(!req.body.total.bookIds) { res.status(404).send(JSON.stringify("Resource Not Found.. :-(")); }
	var result = boardroom.update_payload_for_existing_result(req, req.body);
	res.setHeader('Cache-Control', 'public, max-age=31557600');
	res.status(200).send(JSON.stringify(result));
})

router.get('/getBooksWithDetails', (req, res) => {
	boardroom.build_payload(req)
		.then( (result) => {
			res.setHeader('Cache-Control', 'public, max-age=31557600');
			res.status(200).send(JSON.stringify(result));
		})
		.catch( (err) =>{
			res.status(500).send(JSON.stringify(err));
		} )
})

router.get('/calculatePotentialPricingStrategy', (req, res) => {
	profit_simulation.simulate_potential_profit(req)
		.then( (result) => {
			res.setHeader('Cache-Control', 'public, max-age=31557600');
			res.status(200).send(JSON.stringify(result));
		})
		.catch( (err) =>{
			res.status(500).send(JSON.stringify(err));
		} )
})

router.post('/calculateProfit', (req, res) => {
  if(req.body.competitors && req.body.self) {
    var response = bellman.profit_api(req.body.self, req.body.competitors);
		res.setHeader('Cache-Control', 'public, max-age=31557600');
    res.status(200).send(JSON.stringify(response));
  } else {
    res.status(404).send(JSON.stringify("Resource Not Found.. :-("));
  }
});

router.post('/sellingProbability', (req, res) => {
  if(req.body.competitors && req.body.self) {
    var response = bellman.probability_to_sell(req.body.self.amount, req.body.self.price, req.body.competitors);
		res.setHeader('Cache-Control', 'public, max-age=31557600');
    res.status(200).send(JSON.stringify(response));
  } else {
    res.status(404).send(JSON.stringify("Resource Not Found.. :-("));
  }
});

router.get('/static-data', (req, res) => {
	data.baseData()
		.then( data => {
			res.json(data)
		})
});

router.param('isbn', function(req, res, next, isbn) {
    req.isbn = isbn;

    next();
});

router.get( '/books', books.getAll )
router.get( '/book/:isbn', books.get )
