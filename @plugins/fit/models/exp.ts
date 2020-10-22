import {
  Exp
} from "../data/exp-collection";

import * as R from "ramda";
import * as F from "fluture";
import {Maybe} from "purify-ts";
import * as FP from "../utils/fp-utils";
import * as User from "./user";
import * as db from "../data/exp-collection";

import Week from "../domain/exp/Week";

import bastion from "@services/bastion";
import * as Config from "../config";
import { DateTime } from "luxon";

// re-exports
export type {
  Exp as Model
};

/****************************************************************
 *                                                              *
 * Futures [IO]                                                 *
 *                                                              *
 ****************************************************************/

export const getCurrentProgress = (discordId: string) => db.getUserWeek(discordId, Week.current());


/****************************************************************
 *                                                              *
 * Exp                                                          *
 *                                                              *
 ****************************************************************/


/****************************************************************
 *                                                              *
 * Aggregate                                                    *
 *                                                              *
 ****************************************************************/

export const totalExp = R.pipe(
  R.map<Exp, number> 
    (FP.prop ("exp")),
  R.sum
)