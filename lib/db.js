'use strict';

const hdb = require('hdb'),
	path = require('path'),
	conf = require(path.join(__dirname, 'database', 'dbconfig.json')).hana ;

/*
* here, we are just creating the HANA connection based on the information
* in db_conf.json. Copy the template and fill in your values.
*/
const client = hdb.createClient({
	host: conf.host,
	port: conf.port,
	user: conf.user,
	password: conf.password
});

/*
* Maybe add some more meaningful error handling here.
* client.readyState might be helpful as well
*/
client.connect((err) => {
	if (err) {
		console.error(err);
	}
});

client.on('error', (err) => {
	console.error(err);
});


/*
* just expose the two functions prepare and exec
*/
['prepare', 'exec'].forEach((prop) => {
	module.exports[prop] = client[prop].bind(client);
});