# Dynamic Pricing for Online Marketplaces

This repo holds the source code for the report [Dynamic Pricing on Online Marketplaces](https://hpi.framsteg.de/data/epic/Dynamic_Pricing.pdf). Here, the authors demonstrate, how to use logistic regression to estimate sales probabilities for books based on real data.  For this purpose, important features and ways to evaluate the quality of a training model will be assessed.  Based on the sales probabilities, the bellman equation will be used to predict the optimal prices.

## Prerequisites

Download and install the most recent Node.js LTS release from [https://nodejs.org](https://nodejs.org/).

Make sure `node` and `npm` are in your path.


## Installation

1. `npm install` (This loads all third party modules)
2. `cp lib/database/db_conf.json.template lib/database/db_conf.json` and add your database credentials for the SAP HANA instance


## Folder Overview

* lib: contains the server-side code
* src: contains all client-side files that will be served by the web server
* node_modules: contains all third party dependencies
* R: scripts written in R for R Studio
* docu: contains screenshots and images

## Start Up

* `node .` starts the application
* `npm start` starts the application with nodemon (automatic restart when files are changing)
* `http://localhost:7070` shows the Dashboard

## Routes

* `/` serves src/index.html
* `/api/api_name` starts a HANA query
* `/api/static-data` loads sample data from data.js


## Troubleshooting

After a pull re-run `npm install` to get new dependencies.

## Application View

### Overview

![alt tag](/docu/dashboard.png?raw=true)

### Book Search

![alt tag](/docu/book_overview.png?raw=true)

### Book Details

![alt tag](/docu/book_details.png?raw=true)

### Boardroom

![alt tag](/docu/boardroom.png?raw=true)
![alt tag](/docu/boardroom_chart.png?raw=true)

### Profit Simulation

![alt tag](/docu/profit_estimation.png?raw=true)
