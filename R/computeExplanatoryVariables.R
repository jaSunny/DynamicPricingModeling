computeExplanatoryVariables <- function(prices, beta, competitorData){
  
  ownFeedback <- 60000
  ownRating <- 6
  ownShipping <- 1
  data2 <- as.matrix(subset(data, select = c(offer_price,offer_01_price,offer_02_price,offer_03_price,offer_04_price,offer_05_price,offer_06_price,offer_07_price,offer_08_price,offer_09_price,offer_10_price)))
  data3 <- as.matrix(subset(data, select = c(offer_quality,offer_01_condition,offer_02_condition,offer_03_condition,offer_04_condition,offer_05_condition,offer_06_condition,offer_07_condition,offer_08_condition,offer_09_condition,offer_10_condition)))
  data4 <- as.matrix(subset(data, select = c(offer_01_feedback,offer_02_feedback,offer_03_feedback,offer_04_feedback,offer_05_feedback,offer_06_feedback,offer_07_feedback,offer_08_feedback,offer_09_feedback,offer_10_feedback)))
  data5 <- as.matrix(subset(data, select = c(offer_01_rating,offer_02_rating,offer_03_rating,offer_04_rating,offer_05_rating,offer_06_rating,offer_07_rating,offer_08_rating,offer_09_rating,offer_10_rating)))
  data6 <- as.matrix(subset(data, select = c(offer_01_shipping,offer_02_shipping,offer_03_shipping,offer_04_shipping,offer_05_shipping,offer_06_shipping,offer_07_shipping,offer_08_shipping,offer_09_shipping,offer_10_shipping)))
  data6 <- data6%%100
  data6 <- data6%%10
  
  xx <- matrix(, nrow = length(prices), ncol = length(beta))
  for (i in 1:length(prices)) {
    xx[i,1] <- 1 #intercept
    
    competitorPrices <- as.numeric(competitorData[1,] [! competitorData[1,] %in% c(0,0.01)]) 
    #we only choose the first row here - new computation in simulation needed to achieve better pricing policy
    #make a function out of this and call after every 10th simulation step
    
    #we only need to consider the above if competitors change prices - for book with isbn10==3825223752 this is not the case
    
    xx[i,2] <- median(competitorPrices)
    xx[i,3] <- prices[i] - min(competitorPrices)
    xx[i,4] <- prices[i] - median(competitorPrices)
    xx[i,5] <- prices[i] - sd(competitorPrices)
    
    rank <- 1
    for(c in 1:length(competitorPrices)){
      if (competitorPrices[c]<prices[i]){
        rank <- rank+1
      }
    }  
    xx[i,6] <- rank
    xx[i,7] <- log(rank)
    xx[i,8] <- data[i,]$sales_rank
    xx[i,9] <- log(data[i,]$sales_rank)
    price <- as.character(data2[i,1])
    xx[i,10] <- 1-ceiling((as.numeric(substr(price,nchar(price),nchar(price)))%%9)/9) #psychological price
    quality <- as.numeric(data3[i,] [! data3[i,] == 0])
    xx[i,11] <- rank(quality,ties.method = "max")[1] #quality rank
    feedback <- as.numeric(data4[i,] [! data4[i,] == 0])
    append(feedback, ownFeedback, after = 0)
    feedback <- feedback * -1
    xx[i,12] <- rank(feedback,ties.method = "max")[1]  #feedback rank
    rating <- as.numeric(data5[i,] [! data5[i,] == 0])
    append(rating, ownRating, after = 0)
    rating <- rating * -1
    xx[i,13] <- rank(rating,ties.method = "max")[1]  #rating rank
    shipping <- as.numeric(data6[i,] [! data6[i,] == 0])
    append(shipping, ownShipping, after = 0)
    xx[i,14] <- rank(shipping,ties.method = "max")[1]  #shipping rank
    xx[i,15] <- data[i,]$offer_quality
    xx[i,16] <- data[i,]$offers_total_count
    xx[i,17] <- data[i,]$offers_used_count
    
  }
  return(xx)
}
rm(data2, data3, data4, data5, data6, ownFeedback, ownRating, ownShipping)