import * as R from "ramda";
import * as t from "io-ts";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {pipe, flow} from "fp-ts/function";
import {FilterQuery, OptionalId} from "mongodb";
import mongodb from "@app/mongodb";
import {DecodeError, MongoDbError, NotFound} from "@packages/common-errors";

export interface Collection<T> {
  find(filter?: FilterQuery<T>): TE.TaskEither<Error, T[]>;
  findOne(filter: FilterQuery<T>): TE.TaskEither<Error, T>;
  insert(obj: T): TE.TaskEither<Error, boolean>;
  update(filter: FilterQuery<T>, obj: Partial<T>): TE.TaskEither<Error, boolean>;
}

export function collection<T>(collectionName: string, codec: t.Type<T>): Collection<T> {
  const db = () => mongodb().collection<T>(collectionName);
  const decode = flow(
    codec.decode, 
    E.mapLeft(DecodeError.lazy("Didn't work")),
    TE.fromEither
  );

  return {
    find: filter => pipe(
      TE.tryCatch (() => db().find(filter).toArray(), MongoDbError.fromError), 
      TE.chain (
        flow(R.map(decode), A.sequence(TE.taskEither))
      )
    ),
    
    findOne: filter => pipe(
      TE.tryCatch(() => db().findOne(filter), MongoDbError.fromError),
      TE.chain(res =>
        !res ? TE.left(NotFound.create('')) : decode(res)
      )
    ),

    insert: obj => {
      const insert = (obj: T) => TE.tryCatch(
        () => db().insertOne(obj as OptionalId<T>),
        MongoDbError.fromError
      );
      
      return pipe(
        decode(obj),
        TE.chain(insert),
        TE.map(R.T)
      );
    },

    update: (filter, obj) => pipe(
      TE.tryCatch(
        () => db().updateOne(filter, {$set: obj}), 
        MongoDbError.fromError
      ),
      TE.map(R.T)
    )
  };
}