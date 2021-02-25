import { color, description, embed, title } from "@packages/embed";

import * as u from "../models/User";

// todo: this doesn't work with 0 HR logs
export const render = (users: u.User[]) => {
  const sorted = users.sort((a, b) => a.fitScore > b.fitScore ? -1 : 1);

  return embed(
    color(0xffffff),
    title("Scores"),
    description(sorted.map(toRow).join("\n"))
  )
};

const toRow = (user: u.User) => `**${u.rank(user)}** • ${user.name}`;