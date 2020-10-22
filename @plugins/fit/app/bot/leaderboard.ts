import type {Embed} from "@services/bastion/fp";
import type {PublicUser} from "@plugins/fit/models/user";
import type {Request} from "@services/bastion";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../../utils/fp-utils";
import * as User from "../../models/user";

import format from 'string-format';
import {handleError} from "./errorHandler";

export const leaderboard = (req: Request) => {
  const empty = () => req.text("Nobody has a fit score :(");
  const reply = R.pipe (createEmbed, req.embed);

  const sendLeaderboard = R.ifElse (R.isEmpty, empty, reply);

  R.pipe(
    User.getAllAsPublic,
    F.fork (handleError(req)) (sendLeaderboard)
  )()
}

const createEmbed = (users: PublicUser[]): Embed => ({
  color: 0x4ba7d1,

  author: {
    name      : "Fit Score Leaderboard",
    icon_url  : "https://imgur.com/Wj9X4s0.png"
  },

  description: R.pipe(
    FP.sortByProp<PublicUser> ("fitScore", 1),
    FP.mapIdx (formatEntry),
    R.join ("\n")
  ) (users)
})

const formatEntry = (user: PublicUser, i: number) => format(
  '{0}. **{1}** • {2}',
    String (i + 1),
    user.displayName,
    user.fitScore.toFixed(0)
  )