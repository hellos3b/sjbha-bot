import * as R from "ramda";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";

import {server} from "@app/bastion";
import type { Member } from "@packages/bastion";
import * as db from "../io/user-db";
import * as hr from "./Heartrate";
import * as fs from "./FitScore";
import * as xp from "./Exp";

import {auth, Authentication} from "./Authentication";
import { createClient, StravaClient } from "../io/strava-client";
import { NotConnected } from "../errors";
import { Unauthorized } from "@packages/common-errors";
import { Workout } from "./Workout";

export type UnauthorizedUser = {
  readonly _tag: "UnauthorizedUser";
  readonly id: string;
  readonly password: string;
  // readonly member: TE.TaskEither<Error, Member>;
};

/**
 * A user who's finished authorization with strava
 */
export type FitUser = {
  readonly _tag: "FitUser";
  // readonly member: TE.TaskEither<Error, Member>;
  readonly auth: Authentication;
  readonly gender: string;
  readonly zones: O.Option<hr.Zones>;
  readonly exp: xp.EXP;
  readonly score: fs.FitScore;
};

export const fromDatabase = (user: db.User): E.Either<UnauthorizedUser, FitUser> => {
  if (!user.refreshToken) return E.left({
    _tag: "UnauthorizedUser", 
    id: user.discordId,
    password: user.password
  });

  return E.right({
    _tag: "FitUser",
    auth: auth(user),
    gender: user.gender,
    zones: pipe(
      O.fromPredicate(R.gt(0))(user.maxHR),
      O.map(hr.zones)
    ),
    exp: xp.exp(user.xp),
    score: fs.score(user.fitScore)
  });
}

export const logWorkout = (activity: Workout) => (user: FitUser): FitUser => {
  return user;
}

// const fold = <T>(notConnected: (user: UnauthorizedUser) => T, connected: (user: FitUser) => T) => {
//   return (user: User) => isUnauthorized(user) ? notConnected(user) : connected(user);
// }
  // // todo: User concern
  // const getToken = (user: UserDTO) => pipe(
  //   O.fromNullable(user.refreshToken),
  //   E.fromOption(Unauthorized.lazy("User does not have a refresh token"))
  // );