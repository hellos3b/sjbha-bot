import * as R from "ramda";
import * as F from "fluture";
import { number } from "purify-ts";

import Collection from "../collections/Collection";
import * as Error from "../errors";
import randomstring from "randomstring";

export interface User {
  // ids
  discordId: string;
  stravaId: string;

  // oauth
  password: string;
  refreshToken: string;

  // prefs
  gender: string;
  maxHR: number;

  // progression
  xp: number;
  fitScore: number;
}

const withDefaults = (user: Partial<User>): User => 
  R.mergeLeft<Partial<User>, User>(user, {
    discordId   : "",
    stravaId    : "",
    password    : "",
    refreshToken: "",
    gender      : "",
    maxHR       : 0,
    xp          : 0,
    fitScore    : 0
  });

const newUser = (id: string) => withDefaults({
  discordId   : id,
  password    : randomstring.generate()
});


const collection = new Collection<User>('fit-users');

export const insertNewUser = (id: string) => {
  const user = newUser(id);

  return R.pipe(
    collection.insertOne,
    F.map (R.always (user))
  )(user);
}

const getById = (id: string) => collection.findOne({discordId: id});

export const fetch = R.pipe(
  getById,
  F.map (withDefaults)
);

export const getOrCreate = (id: string) => R.pipe(
  fetch,
  F.chainRej (() => insertNewUser(id)) 
)(id)