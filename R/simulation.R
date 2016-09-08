simulateSales <- function(TT,N,a_opt,steps1,steps2,prices1,pi){
  nt <- as.vector(rep(N, TT))
  at <- as.vector(rep(0, TT))
  at[1] <- a_opt[N]
  
  for (t in 2:TT) {
    #adjust prices
    if(at[t-1]<=40){
      index <- (at[t-1] -1 )/steps1 +1  
    }else{
      index <- length(prices1)+(at[t-1] -41 )/steps2 +1  
    }
    
    if(nt[t-1]>0 && runif(1,0,1)<pi[2,index]) { #we can adjust the sales probability here
      nt[t] <- max(0,nt[t-1]-1)
    }
    else{
      nt[t] <- max(0,nt[t-1])
    }
    
    if(nt[t]>0){
      at[t] <- a_opt[nt[t]]
    }
  }
  
  res <- data.frame(nt,at)
  return(res)
}