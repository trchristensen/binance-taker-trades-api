require("dotenv").config();
var stats = require("stats-lite");
const pairList = require("./pairList.js");
const Binance = require("binance-api-node").default;
const server = require("./server");
let redis_url = process.env.REDIS_URL;
const Redis = require("ioredis");
const PORT = process.env.PORT || 5000;
const client = require("redis").createClient(redis_url);
const redis = new Redis(redis_url);
const JSONCache = require("redis-json");
const jsonCache = new JSONCache(redis, { prefix: "cache:" });

const getTrades = async tradeInfo => {
  const { symbol, startTime, endTime } = tradeInfo;

  const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY
  });

  const trades = await client.aggTrades({ symbol, startTime, endTime });

  const takerData = rangeBuyVsSell(trades, lowMidHighRanges(trades));
  saveData(takerData, tradeInfo.symbol);

  // console.log(`S Time: ${new Date(startTime)}`);
  // console.log(`E Time: ${new Date(endTime)}`);
   
};

const saveData = (takerData, symbol, startTime, endTime) => {
  console.log(`${symbol}`);
  // console.table(takerData);

  let newTakerData = {
    symbol: symbol,
    totalTrades: takerData.totalTrades,
    averageTradeSize: takerData.averageTradeSize,
    marketBuyVolume: takerData.marketBuyVolume,
    marketSellVolume: takerData.marketSellVolume,
    netVolume: takerData.netVolume,
    percentNet: takerData.percentNet,
    lowMarketBuys: takerData.lowMarketBuys,
    lowMarketSells: takerData.lowMarketSells,
    netLow: takerData.netLow,
    midMarketBuys: takerData.midMarketBuys,
    midMarketSells: takerData.midMarketSells,
    netMid: takerData.netMid,
    highMarketBuys: takerData.highMarketBuys,
    highMarketSells: takerData.highMarketSells,
    netHigh: takerData.netHigh,
    netLowPercent: takerData.netLowPercent,
    netMidPercent: takerData.netMidPercent,
    netHighPercent: takerData.netHighPercent,
    lowRangeStart: takerData.lowRangeStart,
    lowRangeEnd: takerData.lowRangeEnd,
    highRangeStart: takerData.highRangeStart,
    highRangeEnd: takerData.highRangeEnd,
    netBuyVsSell: takerData.netBuyVsSell
  };
  const TakerData = {};
  TakerData[symbol] = newTakerData;

  jsonCache.set("takerData", TakerData);
};

function start(symbol, interval) {
  const currentTime = new Date().getTime();
  const startTime = new Date().getTime() - interval;

  getTrades({
    symbol: symbol,
    startTime: startTime,
    endTime: currentTime
  });

  // Keeps the function looping over and over

  setInterval(function() {
    const currentTime = new Date().getTime();
    const startTime = new Date().getTime() - interval;

    getTrades({
      symbol: symbol,
      startTime: startTime,
      endTime: currentTime
    });
  }, 15000);
}

/* 
    Gets the nets of ranges
    Accepts objects (trades, lowMidHighRanges)
    Returns an object.
  */
const rangeBuyVsSell = (tradesArr, lowMidHighRanges) => {

  const marketBuys = tradesArr.filter(function(trade) {
    return trade.isBuyerMaker === false;
  });

  const marketSells = tradesArr.filter(function(trade) {
    return trade.isBuyerMaker === true;
  });

  const marketBuyVolume = marketBuys
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const marketSellVolume = marketSells
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const netVolume = (marketBuyVolume + marketSellVolume);
  const netBuyVsSell = (marketBuyVolume - marketSellVolume);
  const percentNet = (((marketBuyVolume - marketSellVolume) / netVolume) * 100);

  // get percentiles
  const smallestTrade = lowMidHighRanges.quants[0];
  const sixtysixthPercentile = stats.percentile(lowMidHighRanges.quants, 0.666);
  const fiftyPercentile = stats.percentile(lowMidHighRanges.quants, 0.5);
  const thirtythirdPercentile = stats.percentile(lowMidHighRanges.quants, 0.333);
  const standardDeviation = stats.stdev(lowMidHighRanges.quants);
  const mean = stats.stdev(lowMidHighRanges.quants);
  const biggestTrade = lowMidHighRanges.quants[lowMidHighRanges.quants.length - 1];

  const lowMarketTrades = tradesArr.filter(trade => trade.quantity <= thirtythirdPercentile);
  const midMarketTrades = tradesArr.filter(trade => trade.quantity > thirtythirdPercentile && trade.quantity <= sixtysixthPercentile);
  const highMarketTrades = tradesArr.filter(trade => trade.quantity > sixtysixthPercentile);

  const lowMarketTradesSum = lowMarketTrades
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const midMarketTradesSum = midMarketTrades
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    })
    .reduce((a, b) => a + b, 0);

  const highMarketTradesSum = highMarketTrades
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    })
    .reduce((a, b) => a + b, 0);

  // low mid high market order functions
  const lowMarketBuys = lowMarketTrades
    .filter(trade => trade.isBuyerMaker === false)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const lowMarketSells = lowMarketTrades
    .filter(trade => trade.isBuyerMaker === true)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const midMarketBuys = midMarketTrades
    .filter(trade => trade.isBuyerMaker === false)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const midMarketSells = midMarketTrades
    .filter(trade => trade.isBuyerMaker === true)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const highMarketBuys = highMarketTrades
    .filter(trade => trade.isBuyerMaker === false)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);

  const highMarketSells = highMarketTrades
    .filter(trade => trade.isBuyerMaker === true)
    .map(a => {
      let total = 0;
      total += parseFloat(a.price) * a.quantity;
      return total;
    }).reduce((a, b) => a + b, 0);
  

  const netLow = lowMarketBuys - lowMarketSells;
  const netMid = midMarketBuys - midMarketSells;
  const netHigh = highMarketBuys - highMarketSells;

  const totalLow = lowMarketBuys + lowMarketSells;
  const totalMid = midMarketBuys + midMarketSells;
  const totalHigh = highMarketBuys + highMarketSells;

  const netLowPercent = (netLow / totalLow) * 100;
  const netMidPercent = (netMid / totalMid) * 100;
  const netHighPercent = (netHigh / totalHigh) * 100;


  return {
    // values being used
    totalTrades: lowMidHighRanges.totalTrades,
    netVolume: Math.round(netVolume),
    percentNet: percentNet,
    netBuyVsSell: Math.round(netBuyVsSell),
    netLow: Math.round(netLow),
    netMid: Math.round(netMid),
    netHigh: Math.round(netHigh),
    // end values being used

    lowMarketTrades: lowMarketTrades.length,
    midMarketTrades: midMarketTrades.length,
    highMarketTrades: highMarketTrades.length,
    newTotalTrades:
      lowMarketTrades.length + midMarketTrades.length + highMarketTrades.length,

    marketBuyVolume: Math.round(marketBuyVolume),
    marketSellVolume: Math.round(marketSellVolume),

    lowMarketBuys: Math.round(lowMarketBuys),
    lowMarketSells: Math.round(lowMarketSells),
    midMarketBuys: Math.round(midMarketBuys),
    midMarketSells: Math.round(midMarketSells),
    highMarketBuys: Math.round(highMarketBuys),
    highMarketSells: Math.round(highMarketSells),

    lowMarketTradesSum: Math.round(lowMarketTradesSum),
    midMarketTradesSum: Math.round(midMarketTradesSum),
    highMarketTradesSum: Math.round(highMarketTradesSum),
    allMarketTradesSum: Math.round(
      lowMarketTradesSum + midMarketTradesSum + highMarketTradesSum
    ),

    mbvPlusmsv: Math.round(marketBuyVolume + marketSellVolume),

    smallestTrade,
    thirtythirdPercentile,
    averageTradeSize: Math.round(lowMidHighRanges.averageTradeSize),
    mean: Math.round(mean),
    fiftyPercentile,
    sixtysixthPercentile,
    standardDeviation: Math.round(standardDeviation),
    biggestTrade
  };


};


const lowMidHighRanges = arr => {

  // have to do this because it's messing up with map, SORT and floating ints.
  const newQuantityArr = [];
  for (var i = 0; i < arr.length; i++) {
    newQuantityArr.push(parseFloat(arr[i].quantity));
  }
  const quants = newQuantityArr.sort((newQuantityArr, b) => newQuantityArr - b);

  // const quants = arr.map(a => parseFloat(a.quantity)).sort();
  const n = quants.length;
  const avg = quants.reduce((a, b) => a + b, 0) / n;
  const low = quants.slice(0, n / 3);
  const mid = quants.slice(n / 3, (2 * n) / 3);
  const high = quants.slice((2 * n) / 3);

  return {
    quants,
    low,
    mid,
    high,
    lowRangeStart: quants[0],
    lowRangeEnd: low[low.length - 1],
    highRangeStart: quants.slice((2 * n) / 3)[0],
    highRangeEnd: quants[n - 1],
    totalTrades: n,
    averageTradeSize: avg,
  };
};



const runAll = (symbols) => {
  symbols.forEach(symbol =>
    setTimeout(() => {

    start(symbol, 900000); // 15 minutes
    
  }, 1000));
}

runAll(pairList.pairs);

// runAll(["LINKUSDT"]);

