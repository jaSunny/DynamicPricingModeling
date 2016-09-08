computeSalesProbabilites <- function(prices,beta,xx){
  pi <- matrix(, nrow = 2, ncol = length(prices))
  for (i in 1:length(prices)) { 
    tempSum <- 0
    for(j in 1:length(beta)){
      tempSum <- tempSum + beta[[j]]*xx[i,j]
    }
    
    pi[2,i] <- exp(tempSum)/(1+exp(tempSum)) 
    #we combine the prob of 20 timespans into the approximated prob of 1 time interval (2days)
    #so we get the simulation of expected sales and optimal prices for the first 200 days in 2 days intervals
    #set the factor to 1 if you want to compare optimal prices with real data
    pi[1,i] <- 1 - pi[2,i]
  }
  return(pi)
}