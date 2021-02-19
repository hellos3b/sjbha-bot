import * as env from "@app/env";

export const client_id = env.required("STRAVA_CLIENT_ID");
export const client_secret = env.required("STRAVA_CLIENT_SECRET");
export const host_name = env.HOSTNAME;