import type { Member } from "@packages/bastion";

import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import {pipe, flow, constant, identity} from "fp-ts/function";
import {Lens} from "monocle-ts";

import {server} from "@app/bastion";
import * as db from "../io/user-db";
import * as hr from "./Heartrate";
import * as xp from "./Exp";

import {auth, Authentication} from "./Authentication";
import { Workout } from "./Workout";
import { Unauthorized } from "@packages/common/errors";

export type UnauthorizedUser = {
  readonly _tag: "UnauthorizedUser";
  readonly member: Member;
};

/**
 * A user who's finished authorization with strava
 */
export type FitUser = {
  readonly _tag: "FitUser";
  readonly member: Member;
  readonly refreshToken: string;
  readonly gender: string;
  readonly zones: O.Option<hr.Zones>;
  readonly exp: xp.EXP;
  readonly score: xp.FitScore;
};

export type User = UnauthorizedUser | FitUser;

const lens = Lens.fromProp<FitUser>();

export const fromDatabase = (user: db.User) => (member: Member): User => {
  if (!user.refreshToken) return {
    _tag: "UnauthorizedUser", 
    member
  };

  return {
    _tag: "FitUser",
    member,
    refreshToken: user.refreshToken,
    // auth: auth(user),
    gender: user.gender,
    zones: zones(user.maxHR),
    exp: xp.exp(user.xp),
    score: xp.fitScore(user.fitScore)
  };
};

export const toDatabase = (user: FitUser): Partial<db.User> => ({
  discordId: user.member.id,
  gender: user.gender,
  maxHR: pipe(
    user.zones,
    O.fold(constant (0), R.prop ("max"))
  ),
  xp: user.exp.value,
  fitScore: user.score.value
});

export const isAuthorized = (user: User): user is FitUser => user._tag === "FitUser";

/**
 * Update user gender
 */
export const setGender = (gender: string) => 
  lens('gender').modify(() => gender);

/**
 * 
 */
export const zones = (max: number) =>
  (max === 0) ? O.none : O.some(hr.zones(max));

export const setHeartrate = (max: number) => 
  lens('zones').modify(() => zones(max));

export const addWorkout = (user: FitUser) => {
  return (workout: Workout): [FitUser, xp.EXP] => {
    const hrStream = pipe(
      workout.heartrate, 
      O.map(_ => _.stream)
    );

    const gained = pipe(
      user.zones,
      O.map(xp.expFromZones), 
      O.ap(hrStream),
      O.getOrElse(() => xp.expFromTime(workout.elapsed))
    )

    const updated: FitUser = {
      ...user,
      exp: xp.addExp(gained)(user.exp)
    };

    return [updated, gained];
  }
};

/**
 * At the end of a week, we take all EXP events from the week
 * and either increase or decrease a user's fit score
 */
export const promote = (weekExp: xp.EXP[]) => {
  const update = pipe(
    xp.sum(weekExp),
    xp.levelUpScore
  );

  return lens('score').modify(update);
};

/**
 * Casts the user object to the authorized version.
 */
export const asAuthorized = (user: User): E.Either<Error, FitUser> => 
  isAuthorized(user) ? E.right(user) : E.left(Unauthorized.create("User not authorized"));