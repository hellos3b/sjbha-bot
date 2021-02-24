import * as R from "ramda";
import { sequenceT} from "fp-ts/Apply";
import {taskEither, chainFirstW, chainW, map, sequenceArray} from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import * as tuple from "fp-ts/Tuple";

import * as U from "@packages/discord-fp/User";
import logger from "@packages/logger";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";
import * as Week from "../models/Week";
import * as spotlight from "../views/spotlight";

import {broadcast} from "@app/bot";
import channels from "@app/channels";
import roles from "@app/roles";

const log = logger("fit");

/** How much your fit score goes up by when you hit the goal */
const score_increase = 5;

const max_score = 100;

/** How much exp you need to go up */
const exp_goal = 150;

const broadcastToStrava = broadcast(channels.strava);

/**
 * Gets all of the week's activities and runs promote on
 */
export const run = () => {
  const week = Week.previous();
  log.info({week: week.toFormat("MMM DD")}, "Running promotions");
  
  return pipe(
    sequenceT(taskEither)
      (u.getAll(), lw.find(week)()),
    map (([ users, logs ]) => {
      const promotions = promote(users, logs); 
      return {logs, promotions};
    }),
    chainFirstW (({ promotions }) => {
      const users = promotions.map(tuple.fst);
      users.forEach(updateRoles);
      return sequenceArray(users.map(u.save));
    }),
    map (_ => spotlight.render(week, _.promotions, _.logs)),
    chainW (broadcastToStrava)
  )();
};

export const updateRoles = (user: u.User) => {
  const list = [roles.certified_swole, roles.max_effort, roles.break_a_sweat];
  
  const apply = (roleId: string) => {
    log.debug({roleId}, `Adding role to ${user.member.displayName}`)

    const changes = list.map(
      role => (role === roleId) 
        ? U.addRoleTo(user.member)(role) 
        : U.removeRoleFrom(user.member)(role)
    );

    return sequenceArray(changes)()
  };

  return (user.fitScore >= 100) ? apply(roles.certified_swole)
    : (user.fitScore >= 80) ? apply(roles.max_effort)
    : (user.fitScore >= 60) ? apply(roles.break_a_sweat)
    : apply("");
}

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