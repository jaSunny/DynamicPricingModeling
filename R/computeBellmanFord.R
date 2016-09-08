start <- Sys.time()

#delete explanatory_variables as they aren´t used anymore and free up a lot of ram
if(exists("explanatory_variables")){
  rm(explanatory_variables)
}

#load libraries and needed scripts
library("Rcpp")
sourceCpp("valueFunction.cpp")
source("computeExplanatoryVariables.R")
source("computeSalesProbabilities.R")
source("computeOptimalPrices.R")
source("simulation.R")

#setting up the data and coefficient
competitorData = subset(data, isbn10==3825223752, select = c(offer_01_price,offer_02_price,offer_03_price,offer_04_price,offer_05_price,offer_06_price,offer_07_price,offer_08_price,offer_09_price,offer_10_price))
ownPrices = subset(data, isbn10==3825223752,select=c(offer_price))
beta = fm$coefficients


#setting up parameters
max_price <- 250
steps1 <- 0.2
steps2 <- 1
prices1 <- seq(1,40,steps1)
prices <- c(prices1,seq(41,max_price,steps2))
delta <- 0.99999                                   #discount factor - calculation is given in the slides with the new formula
L <- 0.0002777                                     #holding cost rate - we have costs of 0.1ct per item/month -> L = 0.1/periods per month
N <- 10                                            #initial inventory
TT <- 10000                                        #number of iteration steps


#compute explanatory variables for market situation
xx <- computeExplanatoryVariables(prices, beta, competitorData)


#compute sales probabilites
pi <- computeSalesProbabilites(prices,beta,xx)


#Value Matrix computation
run <- Sys.time()
VV <- matrix(, nrow =  TT+1,ncol = N+1)
VV[TT+1,] <- sapply(1:(N+1),function(i){10*sqrt(i-1)})
VV <- computeValueFunction(prices,pi,L,delta,VV,N,TT)
Sys.time()-run


#get optimal values and prices
v_opt <- sapply(0:N+1,function(i){VV[1,i]})
a_opt <- computeOptimalPrices(N,prices,pi,L,delta,VV,v_opt)


# simulation
simulation <- simulateSales(TT,N,a_opt,steps1,steps2,prices1,pi)
nt <- simulation$nt
at <- simulation$at


Sys.time()-start