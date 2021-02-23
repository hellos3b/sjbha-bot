import * as R from "ramda";
import { sequenceT} from "fp-ts/Apply";
import {taskEither, chainFirstW, mapLeft, map, sequenceArray} from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as tuple from "fp-ts/Tuple";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";
import * as Week from "../models/Week";
import * as spotlight from "../views/spotlight";

import { server } from "@app/bastion";
import channels from "@app/channels";


/** How much your fit score goes up by when you hit the goal */
const score_increase = 5;

const max_score = 100;

/** How much exp you need to go up */
const exp_goal = 150;

export type Promotion = [user: u.User, diff: number];

export const promoteUser = (user: u.User, exp: number): Promotion => {
  const percent = exp / exp_goal;
  const update = (percent >= 1)
    ? score_increase
    : -score_increase * (1 - percent);

  const fitScore = R.clamp(0, max_score, user.fitScore + update);
  const diff = fitScore - user.fitScore;

  return [{...user, fitScore}, diff];
}

/**
 * Iterate over a list of users and either increase or decrease their fit score
 * 
 * @param users a list of all users
 * @param logs all logs in the week for promotions
 */
export const promote = (users: u.User[], logs: lw.LoggedWorkout[]) => {
  const userExp = (user: u.User) => pipe(
    logs.filter(_ => _.discord_id === user.discordId),
    lw.sumExp
  );

  return users.map(user => promoteUser(user, userExp(user)));
}

/**
 * Gets all of the week's activities and runs promote on
 */
export const run = () => {
  const week = Week.previous();
  
  return pipe(
    sequenceT(taskEither)
      (u.getAll(), lw.find(week)()),
    map 
      (([ users, logs ]) => {
        const promotions = promote(users, logs); 
        return {logs, promotions};
      }),
    chainFirstW
      (({ promotions }) => pipe(
        promotions.map(tuple.fst),
        p => p.map(u.save),
        sequenceArray
      )),
    map 
      (_ => spotlight.render(week, _.promotions, _.logs)),
    map
      (view => pipe(
        server.channel(channels.strava),
        map (_ => _.send(view))
      )),
    mapLeft
      (err => {
        console.error("Failed to post spotlight", err);
      })
  )();
};