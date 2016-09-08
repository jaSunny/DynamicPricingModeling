require("pscl")

# Regression with real data
if(!exists("data") || length(data)<=10){
  data <- read.csv(bzfile("buchdaten.csv.bz2"), header = F)
  header <- read.csv("header.csv", header = F)
  colnames(data) <- header$V1 
}

#these are the two examples with sold_yn=2
#you need to set them 1 if you want to use logit regression
data[4798911,]$sold_yn <- 1
data[4799234,]$sold_yn <- 1


if(exists("fm")){
  rm(fm)
}
sink("glmNew.txt")
#fm <- glm(data$sold_yn ~ explanatory_variables[,2]+explanatory_variables[,3]+explanatory_variables[,4]+explanatory_variables[,5], family="binomial")
fm = glm(data$sold_yn ~ explanatory_variables[,1]+explanatory_variables[,2]+explanatory_variables[,3]+explanatory_variables[,4]+explanatory_variables[,5]+log(explanatory_variables[,5])+data$sales_rank+log(data$sales_rank)+explanatory_variables[,6]+explanatory_variables[,7]+explanatory_variables[,8]+explanatory_variables[,9]+explanatory_variables[,10]+data$offer_quality+data$offers_total_count+data$offers_used_count, family="binomial")
summary(fm)
mcFadden <- pR2(fm)[4]
mcFadden
sink()