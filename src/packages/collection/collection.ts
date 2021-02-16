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

export function collection<T>(collectionName: string): Collection<T> {
  const db = () => mongodb().collection(collectionName);

  return {
    find: filter => TE.tryCatch (
      () => db().find(filter).toArray(), 
      MongoDbError.fromError
    ),
    
    findOne: filter => TE.tryCatch(
      () => db().findOne(filter), 
      MongoDbError.fromError
    ),
    //   TE.chain(res =>
    //     !res ? TE.left(NotFound.create('')) : decode(res)
    //   )
    // ),

    insert: obj => TE.tryCatch(
      () => db().insertOne(obj as OptionalId<T>).then(R.T),
      MongoDbError.fromError
    ),
      
    //   return pipe(
    //     decode(obj),
    //     TE.chain(insert),
    //     TE.map(R.T)
    //   );
    // },

    update: (filter, obj) => TE.tryCatch(
      () => db().updateOne(filter, {$set: obj}).then(R.T),
      MongoDbError.fromError
    )
  };
}