const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Trade = new Schema({
  symbol: { type: String, required: false },
  totalTrades: { type: Number, required: true },
  averageTradeSize: { type: Number, required: true },
  marketBuyVolume: { type: Number, required: true },
  marketSellVolume: { type: Number, required: true },
  netVolume: { type: Number, required: true },
  percentNet: { type: Number, required: true },
  lowMarketBuys: { type: Number, required: true },
  lowMarketSells: { type: Number, required: true },
  netLow: { type: Number, required: true },
  midMarketBuys: { type: Number, required: true },
  midMarketSells: { type: Number, required: true },
  netMid: { type: Number, required: true },
  highMarketBuys: { type: Number, required: true },
  highMarketSells: { type: Number, required: true },
  netHigh: { type: Number, required: true },
  netLowPercent: { type: Number, required: true },
  netMidPercent: { type: Number, required: true },
  netHighPercent: { type: Number, required: true },
  lowRangeStart: { type: Number, required: true },
  lowRangeEnd: { type: Number, required: true },
  highRangeStart: { type: Number, required: true },
  highRangeEnd: { type: Number, required: true }
});



module.exports = mongoose.model("Trade", Trade);

