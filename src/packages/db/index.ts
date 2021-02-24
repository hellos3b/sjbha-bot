import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {ReaderTaskEither} from "fp-ts/ReaderTaskEither";
import {pipe, flow, constTrue} from "fp-ts/function";
import {FilterQuery, Collection, OptionalId} from "mongodb";
import mongodb from "@app/mongodb";
import {MongoDbError, NotFoundError} from "@packages/common-errors";

export const collection = <T>(name: string) => () => mongodb().collection<T>(name);

export type Query<T> = FilterQuery<T>;

export const findOne = <T>(q: Query<T>): ReaderTaskEither<Collection<T>, NotFoundError | MongoDbError, T> => {
  return (c: Collection<T>) => pipe (
    TE.tryCatch (
      async () => c.findOne(q),
      MongoDbError.fromError
    ),
    TE.chainW 
      (flow (
        E.fromNullable (NotFoundError.create("The resource you were looking for does not exist in the database: " + JSON.stringify(q))),
        TE.fromEither
      ))
  );
};

export const find = <T>(q: Query<T>): ReaderTaskEither<Collection<T>, MongoDbError, T[]> => {
  return (c: Collection<T>) => TE.tryCatch (
    () => c.find(q).toArray(), 
    MongoDbError.fromError
  )
};

export const update = <T>(q: Query<T>, model: T): ReaderTaskEither<Collection<T>, MongoDbError, boolean> => {
  return (c: Collection<T>) => TE.tryCatch (
    () => c.updateOne(q, {$set: model}).then(constTrue),
    MongoDbError.fromError
  )
};

export const insert = <T>(model: T): ReaderTaskEither<Collection<T>, MongoDbError, boolean> => {
  return (c: Collection<T>) => TE.tryCatch (
    () => c.insertOne(model as OptionalId<T>).then(constTrue),
    MongoDbError.fromError
  )
};

export const aggregate = <T>(pipeline: object[]): ReaderTaskEither<Collection<T>, MongoDbError, T[]> => {
  return (c: Collection<T>) => TE.tryCatch (
    () => c.aggregate(pipeline).toArray(),
    MongoDbError.fromError
  )
};

export const deleteOne = <T>(q: Query<T>): ReaderTaskEither<Collection<T>, MongoDbError, boolean> => {
  return (c: Collection<T>) => TE.tryCatch (
    () => c.deleteOne(q).then(constTrue),
    MongoDbError.fromError
  )
};