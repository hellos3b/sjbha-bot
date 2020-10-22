import type { FilterQuery, OptionalId } from "mongodb";
import {db} from './connection';

// todo: eh
import {error, UNEXPECTED} from "../../@plugins/fit/utils/errors";
import * as R from "ramda";
import * as F from "fluture";

const mongoFail = (err: any) => {
  console.error(`UNEXEPECTD: MongoDB Error`)
  console.error(err);

  return error(UNEXPECTED)("MongoDB threw an error");
}

// This casts any thrown errors as an `errorT`
const catchError = F.mapRej (mongoFail);

/**
 * Wraps mongoDB calls with `Futures` so that it interops better in a functional way
 */
export default class Collection<T> {
  readonly CollectionName: string;

  private get collection() {
    return db().collection<T>(this.CollectionName);
  }

  constructor(collectionName: string) {
    this.CollectionName = collectionName;
  }

  public find = (filter?: FilterQuery<T>) => F.attemptP(() => 
    this.collection.find(filter).toArray()
  ).pipe (catchError);
  
  public findOne = (filter: FilterQuery<T>) => F.attemptP(() => 
    this.collection.findOne(filter)
  ).pipe (catchError);

  public insertOne = (obj: OptionalId<T>) => F.attemptP(() => 
    this.collection.insertOne(obj)
      .then (R.always (obj))
  ).pipe (catchError);

  public replaceOne = (filter: FilterQuery<T>) => (obj: T) => F.attemptP(() =>
    this.collection.replaceOne(filter, obj)
      .then (R.always (obj))
  ).pipe (catchError);
}