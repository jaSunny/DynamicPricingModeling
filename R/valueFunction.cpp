#include <Rcpp.h>
#include <algorithm>
#include <iostream>

using namespace Rcpp;

double computeValue(NumericVector prices, int j, NumericMatrix pi, int n, float l, float delta, NumericMatrix vv, int t) {
  // takes a numeric input and doubles it
  // Rcpp::NumericVector xx(2491);
  //for(int i=0;i<2491;i++){
    //xx[i]=pi(0,i);
  //}
  double value=0;
  double a=prices[j-1];
  
  value = pi(0,j-1)*(std::min(n,0)*a -n*l + delta * vv(t,std::max(0,n-1))) + pi(1,j-1)*(std::min(n,1)*a -n*l + delta * vv(t,std::max(0,n-2)));
  
  
  return value;
}

double computeMaxValue(NumericVector prices, NumericMatrix pi, int n, float l, float delta, NumericMatrix vv, int t){
  NumericVector values(prices.length());
  for(int j=1;j<prices.length();j++){
    values(j) = computeValue(prices,j,pi,n,l,delta,vv,t);
  }
  
  return max(values);
  
}

// [[Rcpp::export]]
NumericVector computeMaxVector(NumericVector prices, NumericMatrix pi, float l, float delta, NumericMatrix vv, int t, int maxN){
  NumericVector maxValues(maxN+1);
  for(int n=0;n<=maxN;n++){
    if(n==0){
      maxValues(0)=0;
    }else{
      maxValues(n) = computeMaxValue(prices,pi,n+1,l,delta,vv,t);  
    }
  }
  return maxValues;
}

// [[Rcpp::export]]
NumericMatrix computeValueFunction(NumericVector prices, NumericMatrix pi, float l, float delta, NumericMatrix vv, int maxN, int tt){
  for(int t=tt;t>=1;t--){
    vv(t-1,_) = computeMaxVector(prices,pi,l,delta,vv,t,maxN);
  }
  return vv;
}