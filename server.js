const express = require("express");
const app = express();
const cors = require("cors");
const router = express.Router();
app.use(express.json());

let redis_url = process.env.REDIS_URL;
const PORT = process.env.PORT || 5000;
const client = require("redis").createClient(redis_url);
const Redis = require("ioredis");
const redis = new Redis(redis_url);
const JSONCache = require("redis-json");
const jsonCache = new JSONCache(redis, { prefix: "cache:" });


//production redis
if (process.env.ENVIRONMENT === "development") {
  require("dotenv").config();
  redis_url = "redis://127.0.0.1";
}

app.get("/api/pairs", cors(), async (req, res, next) => {
  const response = await jsonCache.get("takerData");
  return res.send(response);
});

app.get("/api/pairs/hour", cors(), async (req, res, next) => {
  const response = await jsonCache.get("takerDataHour");
  return res.send(response);
});

app.get("/", (req, res) => res.send("Hello World!"))

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
