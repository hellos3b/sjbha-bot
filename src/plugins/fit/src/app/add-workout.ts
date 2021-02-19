import * as L from "luxon";
import * as O from "fp-ts/Option";
import { sequenceT } from "fp-ts/lib/Apply";
import { pipe} from "fp-ts/lib/function";
import {Lens} from "monocle-ts";

import * as u from "../models/User";
import * as w from "../models/Workout";
import * as lw from "../models/LoggedWorkout";

/**
 * Basic zone targets for working out
 */
export type Zones = {
  readonly max: number;
  readonly vigorous: number;
  readonly moderate: number;
}

/**
 * A breakdown of time spent in each zone
 */
export type TimeInZones = {
  readonly rest: L.Duration;
  readonly moderate: L.Duration;
  readonly vigorous: L.Duration;
}

/**
 * Get a user's heart rate zones based off of their max heartrate
 * HR Zones represent how hard a user is working out
 */
const userZones = (user: u.User): O.Option<Zones> => {
  if (user.maxHR === 0)
    return O.none;

  return O.some({
    max: user.maxHR,
    moderate: user.maxHR * 0.5,
    vigorous: user.maxHR * 0.75
  });
};

/**
 * Calculates how long a workout was spent in a 'zone', based off of max heartrate
 */
export const timeInZone = (zones: Zones, hr: w.Heartrate) => {
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

  return {
    rest: L.Duration.fromObject({seconds: rest}),
    moderate: L.Duration.fromObject({seconds: mod}),
    vigorous: L.Duration.fromObject({seconds: vig})
  }
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
    O.map 
      (args => timeInZone(...args)),
    O.fold 
      (expFromTime, expFromZones)
  );
}

/**
 * Log a workout to a user
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