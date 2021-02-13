import * as R from "ramda";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import {pipe, flow, constant} from "fp-ts/function";

import {server} from "@app/bastion";
import type { Member } from "@packages/bastion";
import * as db from "../io/user-db";
import * as hr from "./Heartrate";
import * as p from "./Progression";

import {auth, Authentication} from "./Authentication";
import { createClient, StravaClient } from "../io/strava-client";
import { NotConnected } from "../errors";
import { Unauthorized } from "@packages/common-errors";
import { Workout } from "./Workout";
import { Lens } from 'monocle-ts'
import { sequenceT } from "fp-ts/lib/Apply";

export type UnauthorizedUser = {
  readonly _tag: "UnauthorizedUser";
  readonly id: string;
  // readonly member: TE.TaskEither<Error, Member>;
};

/**
 * A user who's finished authorization with strava
 */
export type FitUser = {
  readonly _tag: "FitUser";
  readonly gender: string;
  readonly zones: O.Option<hr.Zones>;
  readonly exp: p.EXP;
  readonly score: p.FitScore;
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
      // Only create zones if HR > 0
      O.fromPredicate(R.lt(0))(user.maxHR),
      O.map(hr.zones)
    ),
    exp: p.exp(user.xp),
    score: p.fitScore(user.fitScore)
  });
}

// Lenses
const lens = Lens.fromProp<FitUser>();
const exp = lens('exp');

export const logWorkout = (workout: Workout) => {
  return (user: FitUser): [FitUser, p.EXP] => {
    const expGained = p.expFromWorkout(workout)(user.zones);
    const update = exp.modify(p.addExp(expGained))(user);

    return [update, expGained];
  }
};