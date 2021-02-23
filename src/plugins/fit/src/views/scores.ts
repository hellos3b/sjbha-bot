import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as L from "luxon";
import {pipe, flow} from "fp-ts/function";
import format from "@packages/string-format";
import { author, color, description, embed, field, thumbnail, title } from "@packages/embed";

import * as u from "../models/User";
import * as lw from "../models/LoggedWorkout";
import {Promotion} from "../app/promote";

// todo: this doesn't work with 0 HR logs
export const render = (users: u.User[]) => {
  const sorted = users.sort((a, b) => a.fitScore > b.fitScore ? -1 : 1);

  return embed(
    color(0xffffff),
    title("Scores"),
    description(sorted.map(toRow).join("\n"))
  )
};

const toRow = (user: u.User) => `**${u.rank(user)}** • ${user.member.name}`;