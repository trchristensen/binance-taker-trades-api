require("dotenv").config();
const Binance = require("binance-api-node").default;

const express = require("express");
const app = express();
const router = express.Router();
const db = require("./db");
const Trade = require("./models/trades");
// const path = __dirname + "/views/";

const calcLowTrades = () => {};

(async () => {
  const query = Trade.find({});
  // console.log(await query);
  return query;
})().then(query => {
  // test = [
  //   { symbol: "ETHUSDT", price: "122", quantity: 2 },
  //   { symbol: "ETHUSDT", price: "123", quantity: 5 },
  //   { symbol: "ETHUSDT", price: "122.23", quantity: 20 },
  //   { symbol: "ETHUSDT", price: "122.3", quantity: 8 }
  // ];

  const buysVsSells = arr => {

    const marketBuys = arr.filter(function(trade) {
      return trade.isBuyerMaker === false;
    });

    const marketSells = arr.filter(function(trade) {
      return trade.isBuyerMaker === true;
    });

    const marketBuyVolume = marketBuys
      .map(a => {
        let total = 0;
        total += parseInt(a.price) * a.quantity;
        return total;
      })
      .reduce((a, b) => a + b, 0);

    const marketSellVolume = marketSells
      .map(a => {
        let total = 0;
        total += parseInt(a.price) * a.quantity;
        return total;
      })
      .reduce((a, b) => a + b, 0);

    const netVolume = marketBuyVolume + marketSellVolume;

    const percentNet = ((marketBuyVolume - marketSellVolume) / netVolume * 100).toFixed();

    console.log(`
      marketBuyVolume: ${marketBuyVolume}
      marketSellVolume: ${marketSellVolume}
      netVolume: ${netVolume}
      percentNet: ${percentNet}
      `);

    return {
      marketBuyVolume, marketSellVolume, netVolume, percentNet,
    }

    


  };

  console.log(percentNet(query));

  // console.log(lowMidHighRanges(query));
});
