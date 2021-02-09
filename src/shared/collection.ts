import {FilterQuery, OptionalId} from "mongodb";
import * as R from "ramda";
import {Maybe} from "purify-ts";
import mongodb from "@app/mongodb";
import {decodeError, mongoDbError} from "@shared/errors";
import {Codec} from "purify-ts";

export interface Collection<T> {
  find(filter?: FilterQuery<T>): Promise<T[]>;
  findOne(filter: FilterQuery<T>): Promise<Maybe<T>>;
  insert(obj: T): Promise<boolean>;
  update(filter: FilterQuery<T>, obj: Partial<T>): Promise<boolean>;
}

export function collection<T>(collectionName: string, codec: Codec<T>): Collection<T> {
  const db = () => mongodb().collection<T>(collectionName);

  const mongoError = (err: any) => {
    throw mongoDbError(err.message || "MongoDB failed from an unknown error");
  }

  const decode = (input: T) =>
    codec.decode(input)
      .either(
        err => {throw decodeError(err)}, 
        R.identity
      );

  return {
    find: filter => db()
      .find(filter)
      .toArray()
      .then(R.map(decode)),
    
    findOne: filter => db()
      .findOne(filter)
      .catch(mongoError)
      .then(Maybe.fromNullable)
      .then(_ => _.map(decode)),

    insert: obj => {
      const model = decode(obj);

      return db()
        .insertOne(model as OptionalId<T>)
        .then(R.T)
        .catch(mongoError)
    },

    update: (filter, obj) => db()
      .updateOne(filter, {$set: obj})
      .then(R.T)
      .catch(mongoError)
  };
}