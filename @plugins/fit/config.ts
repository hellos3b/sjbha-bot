import {DateTime} from "luxon";
import Debug from "debug";
import * as env from "@app/env";
import channels from "@app/channels";
import roles from "@app/roles";
import {ActivityType} from "./domain/strava/Activity";


export const debug = Debug("@plugins:fit");

export const basePath = env.HOSTNAME;

// URLS
export const url_help = "/fit/help";
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
export const auth_scopes = "read,activity:read,profile:read_all";

/** Timezone for all date related operations */
export const timezone = "America/Los_Angeles";

/** The channel ID to post new activities to */
export const post_to_channel = channels.bot_admin;

/** The time when the weekly update gets posted */
export const weekly_post_time = DateTime.local()
  .setZone(timezone)
  .set({ weekday: 1, hour: 8, minute: 0, second: 0 })
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

/** Emojis for each activity type. As a tuple where `[male emoji, female emoji]` */
export const activity_emojis = {
  [ActivityType.RIDE] : ["🚴", "🚴‍♀️"],
  [ActivityType.RUN]  : ["🏃", "🏃‍♀️"],
  [ActivityType.YOGA] : ["🧘‍♂️", "🧘‍♀️"],
  [ActivityType.HIKE] : ["⛰️", "⛰️"],
  [ActivityType.WALK] : ["🚶‍♂️", "🚶‍♀️"],
  [ActivityType.CROSSFIT]: ["🏋️‍♂️", "🏋️‍♀️"],
  [ActivityType.default]: ["🤸‍♂️", "🤸‍♀️"]
};

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