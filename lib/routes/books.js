const q       = require('q')
const db      = require(__dirname + '/../database/dbinterface.js')

var bookData = {};

module.exports = {
  getAll: getAllBooks,
  get: getBook
}

function getAllBooks(req, res){
  db.getBooks(req.query.from, req.query.to)
    .then( (books) => {
      res.setHeader('Cache-Control', 'public, max-age=31557600');
      res.json(books)
    })
    .catch( () =>{
      res.send(500)
    } )
}

function getBook(req, res){
  console.log(req.isbn)
  if(!req.isbn){
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    res.sendStatus(500)
    return
  }
  console.log(req.isbn)

  db.getBook(req.isbn, req.query.from, req.query.to)
    .then( (books) => {
      res.json(books)
    })
    .catch( () =>{
      res.send(500)
    } )
}

function setBookData(isbn, value){
  console.log("setting "+isbn+" to "+value)
  bookData[""+isbn] = value;
}

function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
