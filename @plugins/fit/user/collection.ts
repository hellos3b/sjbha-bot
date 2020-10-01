import * as R from "ramda";
import * as F from "fluture";
import { number } from "purify-ts";

import Collection from "../utils/Collection";
import * as Error from "../utils/errors";
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

export interface Authorized extends User {};

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

const asAuthorized = (password: string) => (user: User) =>
  user.password === password ? F.resolve(<Authorized>user) : F.reject(Error.InvalidCredentials);

export const insertNewUser = R.pipe(newUser, collection.insertOne);
export const fetch = R.pipe(getById, F.map (withDefaults));

export const getOrCreate = (id: string) => R.pipe(
  fetch,
  F.chainRej (() => insertNewUser(id)) 
)(id)

export const getAuthorized = (auth: Auth) =>
  fetch (auth.discordId)
    .pipe (F.chain (asAuthorized (auth.password)))

export const update = (user: Authorized) => 
  collection.replaceOne({discordId: user.discordId})(user);