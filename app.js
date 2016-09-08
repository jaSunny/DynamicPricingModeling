'use strict';

const stylus        = require('stylus')
const bodyParser    = require('body-parser')
const path          = require('path')
const q             = require('q')
const port          = 7070
const cookieParser  = require('cookie-parser')
const express 			= require('express')
const serveStatic 	= require('serve-static')
const apiRouter 		= require('./lib/api_router')
const database 			= require('./lib/database/dbinterface.js')

let app = express();

/*
* Here we are initializing routing rules and static file serving
* for all files in the web folder. To add additional routes, look at lib/router.js
*/
app.use(bodyParser.urlencoded({limit: '50mb',  extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use('/api', apiRouter);
app.use(stylus.middleware(path.join(__dirname, 'styles')));

app.use( express.static(__dirname + '/src') );
app.use( express.static(__dirname + '/node_modules') );

database.init()
	.then( () => {
		app.listen(process.env['PORT'] || port);

		console.log('Started and listening on Port ' + port);
	})
