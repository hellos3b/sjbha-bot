import type { AuthResponse } from "../strava-client/types";
import type {
  User,
  Auth,
  Authorized
} from "../data/user_collection";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../utils/fp-utils";
import * as Strava from "../strava-client/oauth";
import * as db from "../data/user_collection";

/****************************************************************
 *                                                              *
 * Future/IO                                                    *
 *                                                              *
 ****************************************************************/

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
    (Strava.getRefreshTokenF (refreshCode)),
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
export const linkStravaAccount = (user: Authorized, res: AuthResponse) => R.pipe(
  setStravaAuth(res.athlete.id, res.refresh_token),
  setGender(res.athlete.sex)
)(user);