import Debug from "debug";
import {MONGO_URL} from "@app/env";
import {MongoClient} from "mongodb";

const debug = Debug("@services/mongodb");

let client: MongoClient;

MongoClient
  .connect(MONGO_URL, { useUnifiedTopology: true })
  .then(r => client = r)
  .then(() => debug("Connected to mongodb"));

export default {
  getCollection(collection: string) {
    if (!client) throw new Error(`Trying to call 'getCollection' on @services/mongodb, but the database hasn't finished connecting`)
    return client.db().collection(collection);
  }
};