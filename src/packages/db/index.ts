import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {ReaderTaskEither} from "fp-ts/ReaderTaskEither";
import {pipe, flow, constTrue} from "fp-ts/function";
import {FilterQuery, Collection, OptionalId} from "mongodb";
import mongodb from "@app/mongodb";
import {MongoDbError, NotFoundError} from "@packages/common-errors";

export const collection = <T>(name: string) => () => mongodb().collection<T>(name);

const guaranteed = flow (
  E.fromNullable (NotFoundError.create("oops")),
  TE.fromEither
);

export type Query<T> = FilterQuery<T>;

export const findOne = <T>(q: Query<T>): ReaderTaskEither<Collection<T>, NotFoundError | MongoDbError, T> => {
  return (c: Collection<T>) => pipe (
    TE.tryCatch (
      () => c.findOne(q), 
      MongoDbError.fromError
    ),
    TE.chainW 
      (guaranteed)
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

// export function collection<T>(collectionName: string): Collection<T> {
//   const db = () => mongodb().collection(collectionName);

//   return {
//     find: filter => TE.tryCatch (
//       () => db().find(filter).toArray(), 
//       MongoDbError.fromError
//     ),
    
//     findOne: filter => TE.tryCatch(
//       () => db().findOne(filter), 
//       MongoDbError.fromError
//     ),
//     //   TE.chain(res =>
//     //     !res ? TE.left(NotFound.create('')) : decode(res)
//     //   )
//     // ),

//     insert: obj => TE.tryCatch(
//       () => db().insertOne(obj as OptionalId<T>).then(R.T),
//       MongoDbError.fromError
//     ),
      
//     //   return pipe(
//     //     decode(obj),
//     //     TE.chain(insert),
//     //     TE.map(R.T)
//     //   );
//     // },

//     update: (filter, obj) => TE.tryCatch(
//       () => db().updateOne(filter, {$set: obj}).then(R.T),
//       MongoDbError.fromError
//     )
//   };
// }