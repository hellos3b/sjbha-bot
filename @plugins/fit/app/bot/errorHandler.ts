import type {Request} from "@services/bastion";
import * as R from "ramda";

import * as errors from "../../utils/errors";

export const getErrorMessage = (err: any) => {
  switch (err.type) {
    case errors.HASNT_AUTHORIZED: 
      return "You need to connect Strava to the bot first. Use `!fit auth` to get started";

    case errors.RUNTYPE_FAILURE:
      return "\// todo: error message";

    case errors.INVALID_CREDENTIALS:
      return "\// todo: error message";

    case errors.UNEXPECTED:
    default: {
      console.error(err);
      return "An unexpected error just happened, which... shouldn't. *PSSST*, hey <@125829654421438464>, someone found a bug.";
    }
  }
}

export const handleError = (req: Request) => R.pipe(
  getErrorMessage,
  msg => req.reply(msg)
)