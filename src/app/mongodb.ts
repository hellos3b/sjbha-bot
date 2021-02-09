import {MongoClient} from "mongodb";
import Debug from "debug";
import {MONGO_URL} from "./env";

const debug = Debug("@shared/mongodb");

let client: MongoClient;

MongoClient
  .connect(MONGO_URL, { useUnifiedTopology: true })
  .then(r => client = r)
  .then(() => debug("Connected to mongodb"));

export default function mongodb() {
  return client.db();
}