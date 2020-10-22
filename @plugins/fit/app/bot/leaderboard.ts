import type {Request} from "@services/bastion";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../../utils/fp-utils";
import * as User from "../../models/user";

import * as Leaderboard from "./leaderboard-embed";
import {handleError} from "./errorHandler";

export const leaderboard = (req: Request) => {
  const empty = () => req.text("Nobody has a fit score :(");
  const reply = R.pipe (Leaderboard.embed, req.embed);

  const sendLeaderboard = R.ifElse (R.isEmpty, empty, reply);

  R.pipe(
    User.getAllAsPublic,
    F.fork (handleError(req)) (sendLeaderboard)
  )()
}