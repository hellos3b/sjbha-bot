import * as R from "ramda";
import * as F from "fluture";
import { number } from "purify-ts";

import Collection from "../collections/Collection";
import * as Error from "../errors";
import randomstring from "randomstring";

export type Auth = {
  discordId: string;
  password: string;
}

export type User = Auth & {
  stravaId: string;
  refreshToken: string;

  // prefs
  gender: string;
  maxHR: number;

  // progression
  xp: number;
  fitScore: number;
}

export interface AuthorizedUser extends User {};

export const withDefaults = (user: Partial<User>): User => 
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

export const newUser = (id: string) => withDefaults({
  discordId   : id,
  password    : randomstring.generate()
});

const collection = new Collection<User>('fit-users');

const getById = (id: string) => collection.findOne({discordId: id});

const asVerified = (password: string) => (user: User) =>
  user.password === password ? F.resolve(<AuthorizedUser>user) : F.reject(Error.InvalidCredentials);

export const insertNewUser = (id: string) => {
  const user = newUser(id);
  return R.pipe(
    collection.insertOne,
    F.map (R.always (user))
  )(user);
}

export const fetch = R.pipe(
  getById,
  F.map (withDefaults)
);

export const getOrCreate = (id: string) => R.pipe(
  fetch,
  F.chainRej (() => insertNewUser(id)) 
)(id)

export const getAuthorized = (auth: Auth) =>
  fetch (auth.discordId)
    .pipe (F.chain (asVerified (auth.password)))

export const update = (user: AuthorizedUser) => 
  collection.replaceOne({discordId: user.discordId})(user);