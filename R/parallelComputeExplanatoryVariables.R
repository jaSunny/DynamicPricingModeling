library(foreach)
library(parallel)
library(doParallel)

if(!exists("data") || length(data)<=10){
  data <- read.csv(bzfile("buchdaten.csv.bz2"), header = F)
  header <- read.csv("header.csv", header = F)
  colnames(data) <- header$V1 
}

use_processed_data <- 0

if(use_processed_data){
  ownFeedback <- 60000
  ownRating <- 6
  ownShipping <- 1
  data2 <- as.matrix(subset(processedData, select = c(offer_price,offer_01_price,offer_02_price,offer_03_price,offer_04_price,offer_05_price,offer_06_price,offer_07_price,offer_08_price,offer_09_price,offer_10_price)))
  data3 <- as.matrix(subset(processedData, select = c(offer_quality,offer_01_condition,offer_02_condition,offer_03_condition,offer_04_condition,offer_05_condition,offer_06_condition,offer_07_condition,offer_08_condition,offer_09_condition,offer_10_condition)))
  data4 <- as.matrix(subset(processedData, select = c(offer_01_feedback,offer_02_feedback,offer_03_feedback,offer_04_feedback,offer_05_feedback,offer_06_feedback,offer_07_feedback,offer_08_feedback,offer_09_feedback,offer_10_feedback)))
  data5 <- as.matrix(subset(processedData, select = c(offer_01_rating,offer_02_rating,offer_03_rating,offer_04_rating,offer_05_rating,offer_06_rating,offer_07_rating,offer_08_rating,offer_09_rating,offer_10_rating)))
  data6 <- as.matrix(subset(processedData, select = c(offer_01_shipping,offer_02_shipping,offer_03_shipping,offer_04_shipping,offer_05_shipping,offer_06_shipping,offer_07_shipping,offer_08_shipping,offer_09_shipping,offer_10_shipping)))
  data6 <- data6%%100
  data6 <- data6%%10
  
} else{
  
#  if(!exists("timespan")){
#    start <- Sys.time()
#    data2 <- as.matrix(subset(data, select=c(datum_uhrzeit_von,datum_uhrzeit_bis)))
#    timespan <- (as.numeric(as.POSIXct(data2[,2], format="%Y-%m-%d %H:%M:%S.0000000"))-as.numeric(as.POSIXct(data2[,1], format="%Y-%m-%d %H:%M:%S.0000000")))
#    Sys.time()-start
#  }
  
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
}

start <- Sys.time()
no_cores <- detectCores()-2
cl <- makeCluster(no_cores)
registerDoParallel(cl)
chunks <- getDoParWorkers()
chunkSize <- nrow(data2)/chunks
explanatory_variables <- foreach(i = 0:(chunks-1), .combine = rbind) %dopar% {
    
  start <- ceiling(i*chunkSize)
  end <- ceiling((i+1)*chunkSize)
  explanatory_variables <- matrix(, nrow = (end-start), ncol = 10)
  for(row in start:end){
    #=================
    # Computation here
    #=================
    # I cannot use an if here - wtf?
    prices <- as.numeric(data2[row,] [! data2[row,] %in% c(0,0.01)])
    explanatory_variables[(row-start),1] <- median(prices) #overall prices
    explanatory_variables[(row-start),2] <- data2[row,1]-min(prices) #difference to min
    explanatory_variables[(row-start),3] <- data2[row,1]-median(prices)  #difference to median
    explanatory_variables[(row-start),4] <- sd(prices) #price density
    explanatory_variables[(row-start),5] <- rank(prices)[1] #rank
    price <- as.character(data2[row,1])
    explanatory_variables[(row-start),6] <- 1-ceiling((as.numeric(substr(price,nchar(price),nchar(price)))%%9)/9) #psychological price
    quality <- as.numeric(data3[row,] [! data3[row,] == 0])
    explanatory_variables[(row-start),7] <- rank(quality,ties.method = "max")[1] #quality rank
    feedback <- as.numeric(data4[row,] [! data4[row,] == 0])
    append(feedback, ownFeedback, after = 0)
    feedback <- feedback * -1
    explanatory_variables[(row-start),8] <- rank(feedback,ties.method = "max")[1]  #feedback rank
    rating <- as.numeric(data5[row,] [! data5[row,] == 0])
    append(rating, ownRating, after = 0)
    rating <- rating * -1
    explanatory_variables[(row-start),9] <- rank(rating,ties.method = "max")[1]  #rating rank
    shipping <- as.numeric(data6[row,] [! data6[row,] == 0])
    append(shipping, ownShipping, after = 0)
    explanatory_variables[(row-start),10] <- rank(shipping,ties.method = "max")[1]  #shipping rank
  }
  explanatory_variables
}
stopCluster(cl)
head(explanatory_variables)
Sys.time()-start

rm(data2, data3, data4, data5, data6, ownFeedback, ownRating, ownShipping)

#TODO: neighborPrices, fix NA in exp_var 1:5