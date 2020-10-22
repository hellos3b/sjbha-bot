import {Request} from "@services/bastion";

import * as R from "ramda";
import * as F from "fluture";

import format from "string-format";

import * as Config from "../../config";
import * as Exp from "../../models/exp";
import {handleError} from "../../utils/errors";

// Provide a list of the available commands
export const exp = (req: Request) => {
  const reply = R.compose (req.text, progressString);

  R.pipe(
    Exp.getCurrentProgress,
    F.fork (handleError (req)) 
      (reply)
  )(req.author.id)
}

const formatProgress = (exp: number) => format(
  'Weekly EXP: {0}/{1}',
  exp.toFixed(0),
  String(Config.weekly_exp_goal)
)

const progressString = R.compose (formatProgress, Exp.totalExp);