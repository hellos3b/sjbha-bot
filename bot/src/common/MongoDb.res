open StdLib

module Collection = {
  type t
  type cursor

  @send external insertOne: (t, 'a) => Promise.t<'a> = "insertOne"
  @send external find: (t, {..}) => cursor = "find"
  @send external findAll: t => cursor = "find"

  // cursor stuff
  @send external sort: (cursor, {..}) => cursor = "sort"
  @send external limit: (cursor, int) => cursor = "limit"
  @send external toArray: cursor => Promise.t<'a> = "toArray"
}

module Db = {
  type t

  @module("../app/MongoDb")
  external get: unit => Promise.t<t> = "getDb"

  @send external collection: (t, string) => Collection.t = "collection"
}


@module("../app/MongoDb") external getCollection: string => Promise.t<Collection.t> = "getCollection"