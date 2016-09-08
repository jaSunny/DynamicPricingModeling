'use strict'
const global        = require( __dirname + '/global.js')
const q             = require('q')

module.exports = {
  get: getUser,
  insert: insertUser
}

function getUser(email, includeRevokedPackages){
  const deferred = q.defer()
  
  global.instance.query(`SELECT * FROM ${global.tables.user}  WHERE email=?` , email ,function(err, result){
    if(err){
      console.log(err)
      deferred.reject(err)
    }else{
      deferred.resolve(result)
    }
  })

  return deferred.promise
}

function insertUser(user){
  const deferred = q.defer()
  
  global.instance.query('INSERT INTO ' + global.tables.user + ' SET ?', user, function(err, result){
    if(err){
      console.log(err)
      deferred.reject(err)
    }else{

      deferred.resolve()
    }
  })

  return deferred.promise
}
