'use strict'
const global        = require( __dirname + '/global.js')
const q             = require('q')

module.exports = {
  getAll: all,
  getBook: getBook
}

function all(offset, to){
  const deferred = q.defer()
  let query = `SELECT DISTINCT ISBN10 as isbn FROM (SELECT * FROM ${global.tables.observations} WHERE SOLD_YN<>0 )`

  if(offset != null && to != null ){
    var count = to - offset
    query += ` LIMIT ${count} OFFSET ${offset}`
  }

  global.instance.exec(query, (err, result) => {
    if(err){
      console.log(err)
      deferred.reject(err)
    }else{
      deferred.resolve(result)
    }
  })

  return deferred.promise
}

function getBook(isbn, offset, to){
  const deferred = q.defer()
  let query = `SELECT * FROM ${global.tables.observations} WHERE ISBN10='${isbn}' ORDER BY DATUM_UHRZEIT_VON `

  if(offset != null && to != null ){
    var count = to - offset
    query += ` LIMIT ${count} OFFSET ${offset}`
  }

  global.instance.exec(query, (err, result) => {
    if(err){
      console.log(err)
      deferred.reject(err)
    }else{
      deferred.resolve(result)
    }
  })

  return deferred.promise
}
