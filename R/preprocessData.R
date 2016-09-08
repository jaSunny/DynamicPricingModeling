if(!exists("data") || length(data)<=10){
  data <- read.csv(bzfile("buchdaten.csv.bz2"), header = F)
  header <- read.csv("header.csv", header = F)
  colnames(data) <- header$V1 
}

if(!exists("timespan")){
  data2 <- as.matrix(subset(data, select=c(datum_uhrzeit_von,datum_uhrzeit_bis)))
  timespan <- (as.numeric(as.POSIXct(data2[,2], format="%Y-%m-%d %H:%M:%S.0000000"))-as.numeric(as.POSIXct(data2[,1], format="%Y-%m-%d %H:%M:%S.0000000")))
}

#merge timespan to data so that short intervals can easilier be filtered out
processedData <- cbind(data, timespan)

#######################################
#Processing like recommended by Basti #
#######################################
#dont increase these values too much, because otherwise you will lose periods with sales
min_timespan <- 1800 #equals half an hour - timespan is given in seconds
min_offers <- 3      #minimum number of required competitor data
min_offer_price <- 0.01 #minimum own sales price
min_price_level <- 0.75 #minimum of the max price of a period



processedData <- subset(processedData,timespan>min_timespan) #removes 31327 short periods - does not remove sales
processedData <- subset(processedData,offers_total_count>=min_offers) #removes 299801 periods with less competitor information - removes around 200 sales
processedData <- subset(processedData,offer_price>min_offer_price) #removes 100565 1ct offers - removes 174 sales


data2 <- as.matrix(subset(processedData, select = c(offer_price,offer_01_price,offer_02_price,offer_03_price,offer_04_price,offer_05_price,offer_06_price,offer_07_price,offer_08_price,offer_09_price,offer_10_price)))
max_vector <- sapply(1:nrow(data2),function(i){max(data2[i,])})

#merge max_vector to data so that periods with extremely low price level can be filtered out
processedData <- cbind(processedData, max_vector)
processedData <- subset(processedData,max_vector>=min_price_level) #removes 55343 periods with low price level - removes 12 sales


#we have removed 431,693 periods and lost 399 sales


#######################################
#Processing like recommended by Rainer#
#######################################
# min_timespan <- 3600
# processedData <- subset(processedData,timespan>min_timespan) #removes 31327 short periods - does not remove sales
# min_price <- 9.99
# data2 <- as.matrix(subset(processedData, select = c(offer_01_price,offer_02_price,offer_03_price,offer_04_price,offer_05_price,offer_06_price,offer_07_price,offer_08_price,offer_09_price,offer_10_price)))
# min_vector <- sapply(1:nrow(data2),function(i){min(data2[i,][! data2[i,] %in% c(0)])})
# processedData <- cbind(processedData, min_vector)
# processedData <- subset(processedData,min_vector>=min_price)
