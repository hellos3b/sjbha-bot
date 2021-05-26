import {alt, getOrElse, map, none, option} from "fp-ts/Option";
import {Duration} from "luxon";
import {pipe, flow} from "fp-ts/function";
import {sequenceT} from "fp-ts/Apply";

import { color, author, embed, title, field, footer, description, thumbnail } from "@packages/embed";

import {toMiles, toPace, toFeet} from "../models/Distance";
import * as u from "../models/User";
import * as w from "../models/Workout";
import * as lw from "../models/LoggedWorkout";

export const render = (user: u.User, logged: lw.LoggedWorkout, workout: w.Workout, week: lw.LoggedWorkout[]) => embed(
  color (user.member.displayColor),
  author (`${lw.emoji(user, logged)} ${user.member.displayName} ${just(workout)}`),
  thumbnail (user.member.user.displayAvatarURL()),
  title (workout.title),

  workout.description && 
    description (workout.description),

  field("Time", true) (formatElapsed(workout.elapsed)),
  
  ...stats(workout, logged),

  footer (`${expGained(logged)} | ${weekExp([logged, ...week])}`)
);

/**
 * Formats `seconds` into a friendly format such as "15m 32s"
 * Best used to describe elapsed time (hence the name)
 */
export const formatElapsed = (d: Duration): string => {
  if (d.as("hours") > 1) 
    return d.toFormat("h'h' mm'm'");

  if (d.as("minutes") > 0) 
    return d.toFormat("m'm' ss's'");

  return d.toFormat("s's'");
};

/**
 * Formats the part in the title with "just did xx"
 */
const just = (workout: w.Workout) => {
  switch (workout.type) {
    case "Ride":            return "just went for a ride";
    case "Run":             return "just went for a run";
    case "Yoga":            return "just did some yoga";
    case "Hike":            return "just went on a hike";
    case "Walk":            return "just went on a walk";
    case "Workout":         return "just did a workout";
    case "Crossfit":        return "just did crossfit";
    case "RockClimbing":    return "just went rock climbing";
    case "WeightTraining":  return "just lifted some weights";
    default:
      return `just recorded a ${workout.type}`;
  }
}

const fixed = (val: number) => val.toFixed(1);

/**
 * Text showing how much EXP this workout gained,
 * and if HR shows the moderate vs vigorous xp
 */
const expGained = ({ exp_type, exp_gained, exp_vigorous }: lw.LoggedWorkout) => {
  switch (exp_type) {
    case "hr": {
      const moderate = exp_gained - exp_vigorous;
      return `Gained ${fixed(exp_gained)} exp (${fixed(moderate)}+ ${fixed(exp_vigorous)}++)`;
    }
    default:
      return `Gained ${fixed(exp_gained)} exp`;
  }
};

/**
 * Shows how much xp gained this week
 */
const weekExp = flow(
  lw.sumExp, 
  fixed, 
  gained => gained + ' exp this week'
);

/**
 * Render stats per activity.
 * Some activities show different stats, most default to heartrate
 */
const stats = (workout: w.Workout, logged: lw.LoggedWorkout) => {
  type Field = ReturnType<ReturnType<typeof inline>>;
  const inline = (title: string) => field(title, true);
  const show = sequenceT(option);

  // This is a guard, if the activity isn't an HR activity
  // then that could mean the user 
  const hr_option = (logged.exp_type === "hr")
    ? workout.heartrate
    : none;

  const avgHr = pipe(
    hr_option, map (_ => Math.floor(_.average)),
    map (inline("Avg HR"))
  );

  const maxHr = pipe(
    hr_option, map (_ => Math.floor(_.max)),
    map (inline("Max HR"))
  );

  const distance = pipe(
    workout.gps, 
    map (_ => toMiles (_.distance)),
    map (inline("Distance"))
  );

  const elevation = pipe(
    workout.gps, map (_ => toFeet(_.elevation)),
    map (inline("Elevation"))
  );

  const pace = pipe(
    workout.gps, map (_ => toPace(_.averageSpeed)),
    map (inline("Pace"))
  );

  const heartrate = () => show (avgHr, maxHr);

  const fields = (() => { 
    switch (workout.type) {
      case "Run": return pipe(show (distance, pace), alt (heartrate));
      case "Hike": return pipe(show (distance, elevation), alt (heartrate));
      case "Ride": return pipe(show (distance, elevation), alt (heartrate));
      case "Walk": return show (distance);
      case "Yoga":  return show (avgHr);
      default:
        return heartrate();
    } 
  })();

  return pipe(fields, getOrElse((): Field[] => []));
}