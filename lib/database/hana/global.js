'use strict'
const config = require( __dirname + '/../dbconfig.json').hana

const q   = require('q')
const hdb     = require('hdb')
const	path    = require('path')

//Instance variable
const hana_client = hdb.createClient({
	host: config.host,
	port: config.port,
	user: config.user,
	password: config.password
});

//Tables
let tables = {
  observations: config.database + '.OBSERVATIONS_REAL',
  observations_all: config.database + '.OBSERVATIONS'
}

module.exports = {
  init: setupDatabase,
  instance: hana_client,
  tables: tables
}

function connect(){
  var deferred = q.defer()

  hana_client.connect( (err) => {
    if (err) {
      console.error(err);
      deferred.reject(err)
    }
    deferred.resolve()
  });

  hana_client.on('error', (err) => {
    console.error(err);
  });

  return deferred.promise
}

//Filter out all observations with price less than 50 cents
function createObservationsView(){
  var deferred = q.defer()
  const sql = `Create View ${tables.observations} AS  Select * From ${tables.observations_all} where NOT OFFER_PRICE < 0.5`
  const dropView = `DROP VIEW ${tables.observations}`
  
  //Drop view first
  hana_client.exec(dropView, (err, rows) => {
    if(err){
      deferred.reject(err)
    }else{
      
      //Create View
      hana_client.exec(sql, (err, rows) => {
        if (err) {
          deferred.reject(err)
        } else {
          deferred.resolve()
        }
      });
    }
  })
  
  
  
  return deferred.promise
}

function setupDatabase () {
  return connect()
    .then(createObservationsView)
    .then( () => {
      console.log("Connected to Database")
    })
    .catch( err => {
      console.log("Database Error: ", err)
    })
}

// Select count(*)From PRICING_SEMINAR.OBSERVATIONS where 
//   OFFER_PRICE < 0.5 or 
//   ( OFFER_01_PRICE < 0.5 and OFFER_01_PRICE > 0 ) or 
//   ( OFFER_02_PRICE < 0.5 and OFFER_02_PRICE > 0 ) or 
//   ( OFFER_03_PRICE < 0.5 and OFFER_03_PRICE > 0 ) or 
//   ( OFFER_04_PRICE < 0.5 and OFFER_04_PRICE > 0 ) or 
//   ( OFFER_05_PRICE < 0.5 and OFFER_05_PRICE > 0 ) or 
//   ( OFFER_06_PRICE < 0.5 and OFFER_06_PRICE > 0 ) or 
//   ( OFFER_07_PRICE < 0.5 and OFFER_07_PRICE > 0 ) or 
//   ( OFFER_08_PRICE < 0.5 and OFFER_08_PRICE > 0 ) or 
//   ( OFFER_09_PRICE < 0.5 and OFFER_09_PRICE > 0 ) or 
//   ( OFFER_10_PRICE < 0.5 and OFFER_10_PRICE > 0 )