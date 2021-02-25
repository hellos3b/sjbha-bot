import * as R from "ramda";
import * as L from "luxon";
import * as O from "fp-ts/Option";
import { sequenceT } from "fp-ts/lib/Apply";
import {taskEither, Do, bindW, chainFirstW, map} from "fp-ts/TaskEither";
import { pipe} from "fp-ts/lib/function";
import {Lens} from "monocle-ts";
import logger from "@packages/logger";

import * as u from "../models/User";
import * as w from "../models/Workout";
import * as lw from "../models/LoggedWorkout";
import * as Week from "../models/Week";

const log = logger("fit");

/**
 * Basic zone targets for working out
 */
export type Zones = ReturnType<typeof Zones>;
export function Zones(max: number, moderate: number, vigorous: number) {
  return {max, moderate, vigorous} as const;
}

/**
 * A breakdown of time spent in each zone
 */
export type TimeInZones = ReturnType<typeof TimeInZones>;
export function TimeInZones (rest: L.Duration, moderate: L.Duration, vigorous: L.Duration) {
  return {rest, moderate, vigorous} as const;
}

/**
 * Get a user's heart rate zones based off of their max heartrate
 * HR Zones represent how hard a user is working out
 */
const userZones = (user: u.User): O.Option<Zones> => {
  if (user.maxHR === 0)
    return O.none;

  return O.some(Zones(user.maxHR, user.maxHR * 0.5, user.maxHR * 0.75));
};

/**
 * Calculates how long a workout was spent in a 'zone', based off of max heartrate
 */
export const timeInZone = (zones: Zones, hr: w.Heartrate): TimeInZones => {
  const getZone = (hr: number) =>
    (hr >= zones.vigorous) ? "vigorous"
      : (hr >= zones.moderate) ? "moderate"
      : "rest";

  const [rest, mod, vig] = hr.stream.reduce(([rest, moderate, vigorous], sample) => {
    switch (getZone(sample.bpm)) {
      case "vigorous": 
        return [rest, moderate, vigorous + sample.seconds];
      case "moderate": 
        return [rest, moderate + sample.seconds, vigorous];
      default:    
        return [rest + sample.seconds, moderate, vigorous];
    }
  }, [0, 0, 0]);

  const Seconds = (seconds: number) => L.Duration.fromObject({seconds});

  return TimeInZones(Seconds(rest), Seconds(mod), Seconds(vig));
};

/**
 * Calculates how much EXP was gained from a workout.
 * Uses a user's HR zones if available, otherwise is time based
 */
const expGained = (workout: w.Workout) => {
  type ExpResult = ["time" | "hr", number, number];

  const expFromTime = (): ExpResult => 
    ["time", workout.elapsed.as("minutes"), 0];

  const expFromZones = (t: TimeInZones): ExpResult => 
    ["hr", t.moderate.as("minutes"), t.vigorous.as("minutes") * 2];

  return (user: u.User) => pipe(
    sequenceT (O.option) 
      (userZones(user), workout.heartrate),
    O.map (args => timeInZone(...args)),
    O.fold (expFromTime, expFromZones)
  );
}

/**
 * Logging a workout to user calculates how much EXP they gained
 * and applies it to the user object
 * 
 * Returns a tuple of the logged workout and the updated user
 */
export const logWorkout = (workout: w.Workout, user: u.User): [lw.LoggedWorkout, u.User] => {
  const [type, moderate, vigorous] = expGained(workout)(user);

  const logged = lw.create()
    .forUser(user)
    .forWorkout(workout)
    .withExp(type, moderate, vigorous)
    .build();

  const updatedUser = Lens
    .fromProp<u.User>()("xp")
    .modify(_ => _ + moderate + vigorous)
    (user);
  
  return [logged, updatedUser];
};

/**
 * Posts an activity to a user profile. 
 * Updates EXP and saves the logged version of the workout
 */
export const save = (stravaId: number, activityId: number) => {
  log.info({stravaId, activityId}, "Saving workout");

  return pipe(
    Do,
      bindW ('user',       _ => u.fetchByStravaId(stravaId)),
      bindW ('workout',    _ => w.fetch(activityId)(_.user.refreshToken)),
      bindW ('week',       _ => lw.find(Week.current())({discord_id: _.user.discordId})),
      map 
        (_ => {
          const [result, user] = logWorkout(_.workout, _.user);
          console.log(_);
          return {result, user, workout: _.workout, week: _.week};
        }),
      // Insert the logged result first in case an error happens
      chainFirstW
        (_ => lw.insert(_.result)),
      chainFirstW
        (_ => u.save(_.user))
  );
}

/**
 * Removes an activity from the history, and undos the EXP gain from it
 */
export const unsave = (activityId: number) => {
  log.info({activityId}, "Removing Workout");

  return pipe(
    Do,
      bindW ('workout', _ => lw.fetch(activityId)),
      bindW ('user',    _ => u.fetch(_.workout.discord_id)),
      map 
        (({ workout, user }) => ({
          workout,
          user: {
            ...user, 
            xp: user.xp - workout.exp_gained
          }
        })),
      // Insert the logged result first in case an error happens
      chainFirstW
        (({ workout, user }) => sequenceT(taskEither)(
          lw.remove(workout.activity_id),
          u.save(user)
        ))
  );
}