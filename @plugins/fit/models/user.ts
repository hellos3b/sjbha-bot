import type {
  User,
  Auth,
  Authorized
} from "../data/user-collection";

import type {
  Authentication
} from "../data/strava-types";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../utils/fp-utils";
import * as strava from "../data/strava";
import * as db from "../data/user-collection";

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

export const getAll = db.getAll;

export const toPublicUser = (user: User): PublicUser => {
  const member = bastion.getMember(user.discordId);

  return {
    ...user,
    displayName: member.displayName,
    avatar: member.avatar
  };
}

export const getAsPublicUser = R.pipe(
  getById, 
  F.map (toPublicUser)
);

export const getAllAsPublic = R.pipe(
  getAll,
  F.map (R.map (toPublicUser))
);

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
export const linkStravaAccount = (user: Authorized, res: Authentication) => R.pipe(
  setStravaAuth(res.athlete.id, res.refresh_token),
  setGender(res.athlete.sex)
)(user);

const lt = R.flip(R.lt);

/** Convert fit score to rank */
export const rank = R.cond<number, number>([
  [R.equals(0), R.always(0)],
  [lt(20),      R.always(1)],
  [lt(40),      R.always(2)],
  [lt(60),      R.always(3)],
  [lt(80),      R.always(4)],
  [lt(100),     R.always(5)],
  [R.equals(100), R.always(6)]
]);

/** Convert fit score to rank name */
export const rankName = R.pipe(
  rank,
  FP.switchcase({
    0: 'Bushtit',
    1: 'Hummingbird',
    2: 'Goldfinch',
    3: 'Thrasher',
    4: 'Kingfisher',
    5: 'Falcon',
    6: 'Golden Eagle'
  }),
  R.defaultTo('Bushtit')
);