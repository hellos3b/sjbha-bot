import {MongoClient} from "mongodb";
import logger from "@packages/logger";
import {MONGO_URL} from "./env";

const log = logger("mongodb");

let client: MongoClient;

MongoClient
  .connect(MONGO_URL, { useUnifiedTopology: true })
  .then(r => client = r)
  .then(() => log.debug("Connected to mongodb"));

export default function mongodb() {
  if (!client) {
    const error = "MongoDB Client is not connected. (May be an issue with whitelist for network access - VPN can cause an error connected)";
    log.error(error);
    throw new Error(error);
  }

  return client.db();
}