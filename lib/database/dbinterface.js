'use strict'
const dbPath = './hana'
// const dbPath = __dirname + '/rethinkdb'

//import necessary modules
const global = require( dbPath + '/global.js')
const user = require( dbPath + '/user.js')
const book = require( dbPath + '/book.js')

module.exports = {
  init: global.init,
  instance: global.instance,

  //Books
  getBooks: book.getAll,              //@Param ([offset, to]) -> [book]
  getBook: book.getBook,
  //User related DB-Action
  getUser: user.get, // @Param (email) -> user
}
