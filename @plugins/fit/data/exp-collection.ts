import * as R from "ramda";
import * as F from "fluture";

import {
  error,
  ErrorT,
  HASNT_AUTHORIZED,
  INVALID_CREDENTIALS,
  UNEXPECTED
} from "../utils/errors";
import {Collection} from "@services/mongodb";
import Week from "../domain/exp/Week";

export interface Exp {
  activityId: string;
  discordId: string;
  week: string;
  moderate: number;
  vigorous: number;
}

const collection = new Collection<Exp>('fit-exp');

export const getUserWeek = (discordId: string, week: Week) => 
  collection.find({discordId, week: week.id});