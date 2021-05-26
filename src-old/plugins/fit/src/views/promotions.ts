import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as L from "luxon";
import {pipe, flow} from "fp-ts/function";
import format from "@packages/string-format";
import { author, color, description, embed, EmbedReader, field, footer, thumbnail, title } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";
import {Promotion} from "../app/promote";

const promotions_per = 20;

// todo: this doesn't work with 0 HR logs
export const render = (week: L.Interval, promotions: Promotion[]) => {
  console.log("promotions", promotions.length);
  const skipNones = promotions.filter(([user, change]) => !(user.fitScore === 0 && change === 0))
  const chunks = chunk(skipNones, promotions_per);

  // todo: split into views by count
  return chunks.map(p => embed(
    color(0xff0000),

    footer (week.toFormat("MMM dd")),

    // show every user's change
    progress(p)
  ));
};

/**
 * Lists out all promotions / demotions that happened in this week
 */
const progress = (promotions: Promotion[]) => {
  const formatPromotion = ([user, change]: Promotion) => {
    // get up or down doot emoji
    const emoji = (user.fitScore === 100) 
      ? "🔹" : (change > 0) 
        ? "⬆️" : "🔻";// "⬇️";
        
    // add a plus sign if change is positive
    const diff = (change < 0) ? `(${change.toFixed(1)})` : "";
  
    return format("{0} **{1}** {2} {3}")(emoji, u.rank(user), user.member.displayName, diff);
  }

  const text = promotions
    .sort((a, b) => a[0].fitScore > b[0].fitScore ? -1 : 1)
    .map(formatPromotion)
    .join("\n");

  return field("Promotions")(text);
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunked_arr = [];
  let index = 0;
  while (index < array.length) {
    chunked_arr.push(array.slice(index, size + index));
    index += size;
  }
  return chunked_arr;
}