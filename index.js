const server = require("./server");

var CronJob = require("cron").CronJob;

const pairList = require("./pairList");

const worker = require("./worker");

const workerDay = require("./workerHour");

console.log("Binance Taker Trades has been connected");

// new CronJob("* * * * *", worker, null, true, "UTC");

// setTimeout(() => {
//   new CronJob("* * * * *", worker, null, true, "UTC")
// }, 30000)

