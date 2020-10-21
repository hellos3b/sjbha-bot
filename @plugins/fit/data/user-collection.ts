import * as R from "ramda";
import * as F from "fluture";
import randomstring from "randomstring";

import {
  error,
  ErrorT,
  HASNT_AUTHORIZED,
  INVALID_CREDENTIALS,
  UNEXPECTED
} from "../utils/errors";
import Collection from "../utils/Collection";

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

const collection = new Collection<User>('fit-users');

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

// errors
const unauthorized = error(INVALID_CREDENTIALS);
const missingUser = () => error(HASNT_AUTHORIZED)("User isn't authorized");

const guaranteeUser = (user: User|null): F.FutureInstance<ErrorT, User> => 
  !!user ? F.resolve(user) : F.reject(missingUser());

const asAuthorized = (password: string) => (user: User) =>
  (user.password === password)
    ? F.resolve(<Authorized>user) 
    : F.reject(unauthorized());

export const insertNewUser = R.pipe(
  newUser, 
  collection.insertOne
);

export const getById = (id: string) => R.pipe(
  () => collection.findOne({discordId: id}),
  F.chain (guaranteeUser),
  F.map (withDefaults)
)();

export const getOrCreate = (id: string) => R.pipe(
  getById,
  F.chainRej (() => insertNewUser(id)) 
)(id)

export const getAuthorized = (auth: Auth) => R.pipe(
  () => getById (auth.discordId),
  F.chain (asAuthorized (auth.password))
)();

export const update = (user: Authorized) => 
  collection.replaceOne({discordId: user.discordId})(user);