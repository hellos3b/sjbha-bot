import {pipe, defaultTo} from "ramda";
import {activity_emojis} from "../../config";
import {switchcase} from "../../utils/fp-utils";

export type GenderedEmoji = (activityType: string) => string;

// todo: deprecate
/** Gets the emoji from the config */
export const getEmoji = (gender: string): GenderedEmoji => (activityType: string) => pipe(
  switchcase(activity_emojis),
  defaultTo(activity_emojis["default"]),
  ([male, female]) => gender === "M" ? male : female
)(activityType);