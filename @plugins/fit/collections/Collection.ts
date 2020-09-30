import {db} from '@services/mongodb';
import { FilterQuery, OptionalId, UpdateQuery } from "mongodb";

import * as Error from "../errors";
import * as R from "ramda";
import * as Future from "fluture";

/**
 * Wraps mongoDB calls with `Futures` so that it interops better
 * in a functional way
 */
export default class Collection<T> {
  readonly CollectionName: string;

  private get collection() {
    return db().collection<T>(this.CollectionName);
  }

  constructor(collectionName: string) {
    this.CollectionName = collectionName;
  }

  public find = (filter?: FilterQuery<T>) => Future.attemptP(async () => 
    this.collection.find(filter).toArray()
  );
  
  public findOne = (filter: FilterQuery<T>) => Future.attemptP(async () => {
    const res = await this.collection.findOne(filter);
    if (!res) throw Error.NotAuthorized();
    
    return res;
  });

  public insertOne = (obj: OptionalId<T>) => Future.attemptP(async () => 
    this.collection.insertOne(obj)
      .then (R.always (obj))
  );

  public replaceOne = (filter: FilterQuery<T>) => (obj: T) => Future.attemptP(async () =>
    this.collection.replaceOne(filter, obj)
      .then (R.always (obj))
  );
}