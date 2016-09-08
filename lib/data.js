'use strict';

const R     = require("r-script");
const fs    = require("fs")
const q     = require('q')
//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({
  delimiter: ',',
  // header: true
});
 


module.exports = {
  baseData: getBaseData
}

function getBaseData(){
  const deferred = q.defer()
  
  let filename = __dirname + "/../R/partial.csv"
  
  converter.fromFile(filename,function(err,result){
    console.log(err)
    // console.log(processData(result.slice(0,20)))
    let data = processData(result.slice(0,10))
    deferred.resolve(data)
  });
  
  return deferred.promise
}

function processData(data){
  console.log("Processing...")
  return data.map(function(elem){
     let attr = {
       datum_uhrzeit_von: function(date){return (new Date(date)).getTime()},
       datum_uhrzeit_bis: function(date){return (new Date(date)).getTime()},
       sold_yn: function(isSold){return isSold == 0 ? false:true},
       offer_price: null
     }
     
     for(var i=1; i<11; i++){
       if(i != 10){
         attr["offer_0"+i+"_price"] = null
       }else{
         attr["offer_10_price"] = null
       }
     }
     
     let newElem = {}
     for(var j=0; j<Object.keys(attr).length; j++){
       if(attr[Object.keys(attr)[j]] != null)
        newElem[Object.keys(attr)[j]] = attr[Object.keys(attr)[j]]( elem[Object.keys(attr)[j]] )
       else
        newElem[Object.keys(attr)[j]] = elem[Object.keys(attr)[j]] 
     }
     return newElem
  })
}