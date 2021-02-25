import * as R from "ramda";
import * as O from "fp-ts/Option";
import {pipe} from "fp-ts/function";
import { color, field, description, embed, title, EmbedReader, footer, code} from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";

// todo: this doesn't work with 0 HR logs
export const render = (workouts: lw.LoggedWorkout[]) => {
  const mod = workouts
    .map(w => w.exp_gained - w.exp_vigorous)
    .reduce(R.add, 0);

  const vig = workouts
    .map(w => w.exp_vigorous)
    .reduce(R.add, 0);

  const modPercent = mod / (mod + vig);
  const relativeScore = 50 - (modPercent * 100);
  const absScore = relativeScore + 50;

  return embed(
    color(getColor(absScore)),
    title(name(absScore)),

    description(`Your balance score is **${absScore.toFixed(0)}**\n\`${chart(relativeScore)}\``),

    field("Moderate", true)(mod.toFixed(1)),
    field("Vigorous", true)(vig.toFixed(1)),

    footer(`Based off of ${workouts.length} workouts in the last 2 weeks.\nThis command is just for fun and not an accurate representation of training load`)
  )
};

const getColor = (absScore: number) => 
  (absScore < 25) ? 0x2f72a2 
  : (absScore <= 45) ? 0x33b3a7 
  : (absScore < 55) ? 0x57c15a 
  : (absScore < 75) ? 0xd2891d
  : 0xb73030;

const name = (score: number) =>
  (score < 25) ? "Low Aerobic"
  : (score <= 45) ? "Aerobic"
  : (score < 55) ? "Balanced"
  : (score < 75) ? "Anerobic"
  : "High Anerobic";

// This is the pure laziest way to do this lol
const chart = (relScore: number) => {
  const dash_count = 15;
  const marks = Math.floor(Math.abs(relScore) / 50 * dash_count);

  console.log(relScore, marks);

  const fill = (str: string, count: number) =>
    new Array(count).fill(str).join("");

  if (relScore >= -5 && relScore <= 5) {
    return "|" 
      + fill(" ", dash_count) 
      + "+" 
      + fill(" ", dash_count) 
      + "|";
  }

  if (relScore < -5) {
    return "|"
      + fill(" ", dash_count - marks) 
      + fill("<", marks)
      + "+" 
      + fill(" ", dash_count)
      + "|";
  }

  return "|"
    + fill(" ", dash_count) 
    + "+" 
    +  fill(">", marks) 
    + fill(" ", dash_count - marks)
    + "|";
}