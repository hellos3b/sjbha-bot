import type {Request} from "@services/bastion";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../../utils/fp-utils";
import * as User from "../../models/user";

import * as Leaderboard from "./leaderboard-embed";
import {handleError} from "./errorHandler";

export const leaderboard = (req: Request) => {
  const reply = (users: User.PublicUser[]) => 
    FP.isEmpty (users)
      ? req.text("Nobody has a fit score :(")
      : R.compose (req.embed, Leaderboard.embed) (users);

  R.pipe(
    User.getAllAsPublic,
    F.fork (handleError(req)) (reply)
  )()
}