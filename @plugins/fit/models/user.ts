import type {
  User,
  Auth,
  Authorized
} from "../data/user_collection";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../utils/fp-utils";
import * as strava from "../data/strava";
import * as db from "../data/user_collection";

import bastion from "@services/bastion";
import * as Config from "../config";

export {
  User as Model
};

export type PublicUser = User & {
  displayName: string;
  avatar: string;
}

/****************************************************************
 *                                                              *
 * Futures [IO]                                                 *
 *                                                              *
 ****************************************************************/

export const getById = (discordId: string) => db.getById(discordId);

export const toPublicUser = (user: User) => F.attempt(() => {
  const member = bastion.getMember(user.discordId);

  return {
    ...user,
    displayName: member.displayName,
    avatar: member.avatar
  };
})

/** Get an authorized user from a string token */
const authorizedUserFromToken = (token: string) => R.pipe(
  decodeToken,
  db.getAuthorized
)(token);

/** Fetches a user, and if one doesn't exist will create one */
export const initializeUser = (id: string): F.FutureInstance<unknown, User> => R.pipe(
  db.getById,
  F.chainRej (() => db.insertNewUser(id)) 
)(id)

/**  */
export const acceptStravaAuth = (token: string, refreshCode: string) => R.pipe(
  () => F.both 
    (authorizedUserFromToken(token)) 
    (strava.getRefreshToken (refreshCode)),
  F.map (FP.apply (linkStravaAccount)),
  F.chain (db.update)
)();

/****************************************************************
 *                                                              *
 * Purity                                                       *
 *                                                              *
 ****************************************************************/

/** Gets the `hash token` for the User that's used to authenticate web requests */
export const toToken = (user: Auth) => user.discordId + "." + user.password;

/** Get the discord ID and password out of a `hash token` */
export const decodeToken = (token: string): Auth => {
  const [discordId, password] = token.split(".");
  return <const>{discordId, password};
}

/** Convert `xp` to a level */
export const level = (exp: number) => {
  const level = Math.floor(exp / Config.exp_per_level);
  const remainder = exp % Config.exp_per_level;
  const progress = Math.floor(remainder / Config.exp_per_level * 10)/10;

  return 1 + level + progress;
}

/** Update the oauth data for a user */
export const setStravaAuth = (stravaId: number, refreshToken: string) => 
  (user: Authorized): Authorized => ({
    ...user,
    stravaId: String(stravaId),
    refreshToken
  })

/** Update the user's gender */
export const setGender = (gender: string) => 
  (user: Authorized): Authorized => ({
    ...user, gender
  });

/** When a user first links to strava, update the model */
export const linkStravaAccount = (user: Authorized, res: Strava.Authentication) => R.pipe(
  setStravaAuth(res.athlete.id, res.refresh_token),
  setGender(res.athlete.sex)
)(user);