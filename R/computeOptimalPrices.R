computeOptimalPrices <- function(N,prices,pi,L,delta,VV,v_opt){
  a_opt <- vector("numeric", length = N+1)
  for (n in 1:N+1) {
    for (j in 1:length(prices)) { #1:length(prices)
      a <- prices[j]
      tempSum <- pi[1,j]*(min(n,0)*a -n*L + delta * VV[2,max(0,n)]) # 1 no sale & 2 sale 
      tempSum <- tempSum + pi[2,j]*(min(n,1)*a -n*L + delta * VV[2,max(0,n-1)]) # 1 no sale & 2 sale
      if((v_opt[n]-tempSum)<0.000001){
        a_opt[n] <- a
        break
      }
    }
  }
  return(a_opt)
}