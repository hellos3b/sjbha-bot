import {DateTime} from "luxon";
import Debug from "debug";

import * as env from "@app/env";
import channels from "@app/channels";
import roles from "@app/roles";


export const debug = Debug("@plugins:fit");

/** The hostname that this instance of the bot is running on */
export const basePath = env.HOSTNAME;

/** A page that shows the README for help with the command */
export const url_help = "/fit/help";
/** This page checks auth status and either sends you to strava's authorization page, or settings */
export const url_login = "/fit/login";
export const url_settings = "/fit/settings";
export const url_accept = "/fit/accept";

export const client_id = env.required("STRAVA_CLIENT_ID");
export const client_secret = env.required("STRAVA_CLIENT_SECRET");

/** 
 * Authorization scopes  
 * @see https://developers.strava.com/docs/authentication/
 * 
 * `read` gives us access to public activities
 * `activity:read` 
 * `profile:read_all` lets us get HR zones
 **/
export const auth_scopes = "read,activity:read_all,profile:read_all";

/** The channel ID to post new activities to */
export const post_to_channel = channels.strava;

/** How much time to give someone to edit title before posting */
export const post_delay_ms = 5 * 60 * 1000;

export const weekly_post_hour = 8;
export const wekely_post_weekday = 1;
/** The time when the weekly update gets posted */
export const weekly_post_time = DateTime.local()
  .setZone(env.TIME_ZONE)
  .set({ weekday: wekely_post_weekday, hour: weekly_post_hour, minute: 0, second: 0 })
  .toLocal();

/** Role ID for reward getting to best rank */
export const role_rank_1 = roles.certified_swole;
/** Role ID for reward getting to 2nd best rank */
export const role_rank_2 = roles.max_effort;
/** Role ID for reward getting to 3rd best rank */
export const role_rank_3 = roles.break_a_sweat;

/** How long to delay between the webhook to posting to the channel to give people a chance to edit the title. In milliseconds  */
export const webhook_delay = 0;

/** Converts seconds from activity to experience points */
export const exp_multi = (1/60);

/** Additional multiplier for `hard` seconds */
export const hard_multi = 2;

/** How much EXP is required to level up */
export const exp_per_level = 600;

/** HOw much EXP you should try to go for each week */
export const weekly_exp_goal = 150;

/** How many fit score you get when you hit the goal */
export const points_per_goal = 5;

// todo: deprecate
export const ActivityType = {
  RIDE: "Ride",
  RUN: "Run",
  YOGA: "Yoga",
  CROSSFIT: "Crossfit",
  HIKE: "Hike",
  WALK: "Walk",
  WEIGHT_TRAIN: "WeightTraining",
  ROCK_CLIMB: "Climb",
  WORKOUT: "Workout",
  // todo: deprecate 'default'
  default: ""
}

// todo: deprecate
/** Emojis for each activity type. As a tuple where `[male emoji, female emoji]` */
export const activity_emojis = {
  [ActivityType.RIDE] : ["🚴", "🚴‍♀️"],
  [ActivityType.RUN]  : ["🏃", "🏃‍♀️"],
  [ActivityType.YOGA] : ["🧘‍♂️", "🧘‍♀️"],
  [ActivityType.HIKE] : ["⛰️", "⛰️"],
  [ActivityType.WALK] : ["🚶‍♂️", "🚶‍♀️"],
  [ActivityType.CROSSFIT]: ["🏋️‍♂️", "🏋️‍♀️"],
  [ActivityType.WEIGHT_TRAIN]: ["🏋️‍♂️", "🏋️‍♀️"],
  [ActivityType.ROCK_CLIMB]: ["🧗‍♂️", "🧗‍♀️"],
  // todo: deprecate the default type
  [ActivityType.default]: ["🤸‍♂️", "🤸‍♀️"],
  default: ["🤸‍♂️", "🤸‍♀️"]
};

export const male_emojis = {
  [ActivityType.RIDE] : "🚴",
  [ActivityType.RUN]  : "🏃",
  [ActivityType.YOGA] : "🧘‍♂️",
  [ActivityType.HIKE] : "⛰️",
  [ActivityType.WALK] : "🚶‍♂️",
  [ActivityType.CROSSFIT]: "🏋️‍♂️",
  [ActivityType.WEIGHT_TRAIN]: "🏋️‍♂️",
  [ActivityType.ROCK_CLIMB]: "🧗‍♂️",
  default: "🤸‍♂️"
};

export const female_emojis = {
  [ActivityType.RIDE] : "🚴",
  [ActivityType.RUN]  : "🏃",
  [ActivityType.YOGA] : "🧘‍♂️",
  [ActivityType.HIKE] : "⛰️",
  [ActivityType.WALK] : "🚶‍♂️",
  [ActivityType.CROSSFIT]: "🏋️‍♂️",
  [ActivityType.WEIGHT_TRAIN]: "🏋️‍♂️",
  [ActivityType.ROCK_CLIMB]: "🧗‍♂️",
  default: "🤸‍♂️"
}

// todo: deprecate
/** The names of ranks */
export const rank_names: Record<number, string> = {
  [0]: 'Bushtit',
  [1]: 'Hummingbird',
  [2]: 'Goldfinch',
  [3]: 'Thrasher',
  [4]: 'Kingfisher',
  [5]: 'Peregrine Falcon',
  [6]: 'Golden Eagle'
}