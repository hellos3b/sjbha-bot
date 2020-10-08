import type {User} from "./user_collection";
import type { Wretcher } from "wretch";

import wretch from "@services/node-wretch";
import {client_id, client_secret} from "@plugins/fit/config";

import * as R from "ramda";
import * as F from "fluture";

import { error, UNEXPECTED } from "../utils/errors";
import Cache from "node-cache";

// Wretch base to hit the strava API
const api = wretch().url('https://www.strava.com')

// Type any unexpected errors
const failedRequest = () => error(UNEXPECTED)("Unable to fetch from Strava")
const tokensCache = new Cache({ stdTTL: 50 * 60 });

// Shorthand wrapper for attempting a request
const attemptP = <T>(fn: () => Promise<T>) => 
  F.attemptP(fn)
    .pipe (F.mapRej (failedRequest));


/****************************************************************
 *                                                              *
 * Authorization                                                *
 *                                                              *
 ****************************************************************/

/** Get refresh token, use it for a user's first time in authenticating */
const refreshToken = (code: string) => 
  api.url('/oauth/token')
    .post({
      grant_type: "authorization_code",
      code, client_id, client_secret
    })
    .json<Strava.Authentication>();

export const getRefreshToken = (code: string) => attemptP(() => refreshToken(code));



/** If you already have gotten the refresh token, you can use this to get a temporary access token */
const accessToken = async (refresh_token: string) => {
  const cached = tokensCache.get<string>(refresh_token);
  if (cached) return cached;

  const request = {
    grant_type    : "refresh_token",
    client_id, client_secret, refresh_token
  };

  const {access_token} = await api.url('/oauth/token')
    .post(request)
    .json<Strava.Authentication>()

  tokensCache.set(refresh_token, access_token);
  return access_token;
}

type WithClientFn<T> = (client: Wretcher) => Promise<T>;
const withClient = <T>(fn: WithClientFn<T>) => (refreshToken: string) => attemptP(async () => {
  const token = await accessToken(refreshToken);
  const client = api.headers({
    Authorization: "Bearer " + token
  });

  return fn(client);
});


/****************************************************************
 *                                                              *
 * Requests                                                     *
 *                                                              *
 ****************************************************************/

const activities = () => withClient(client =>
  client.url('activities')
    .get()
    .json<Strava.Activity[]>()
);

// API calls
// const profile = (client: Wretcher) => client
//   .url('/authlete')
//   .get()
//   .json<Strava.Athlete>();

/****************************************************************
 *                                                              *
 * Builders                                                     *
 *                                                              *
 ****************************************************************/

export const activitiesSummary = (user: User) => R.pipe(
  activities()
)(user.refreshToken)


/****************************************************************
 *                                                              *
 * Data                                                         *
 *                                                              *
 ****************************************************************/