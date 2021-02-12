import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";

import type {Activity, Auth} from "./strava-types";
import {client_id, client_secret} from "../../config";
import {AsyncClient} from "@packages/async-client";

const StravaClient = (token: string) => {
  const client = AsyncClient({
    baseURL: 'https://www.strava.com/api/v3',
    headers: {"Authorization": "Bearer " + token}
  });

  return {
    activities: (q: Pageable) => client.get<Activity[]>('/activities', q)
  }
}

export type StravaClient = ReturnType<typeof StravaClient>;

/**
 * Creates an authorized Strava client for a user
 * @param refresh_token The token for an authorized user
 */
export const createClient = (token: string) => {
  const auth = (token: string) => AsyncClient()
    .post<Auth>('https://www.strava.com/oauth/token', {
      grant_type    : "refresh_token",
      refresh_token : token,
      client_id, client_secret    
    });

  return pipe(
    auth(token),
    TE.map(res => StravaClient(res.access_token))
  );
}

type Pageable = {
  /** Epoch time */
  before?: number;
  /** Epoch time */
  after?: number;
  /** Defaults to 1 */
  page?: number;
  per_page?: number;  
}



// /** Get refresh token, use it for a user's first time in authenticating */
// const refreshToken = (code: string) => 
//   api.url('/oauth/token')
//     .post({
//       grant_type: "authorization_code",
//       code, client_id, client_secret
//     })
//     .json<Authentication>();

// export const getRefreshToken = (code: string) => attemptP(() => refreshToken(code));

// /** If you already have gotten the refresh token, you can use this to get a temporary access token */
// const accessToken = async (refresh_token: string) => {
//   const cached = tokensCache.get<string>(refresh_token);
//   if (cached) return cached;

//   const request = {
//     grant_type    : "refresh_token",
//     client_id, client_secret, refresh_token
//   };

//   const {access_token} = await api.url('/oauth/token')
//     .post(request)
//     .json<Authentication>()

//   tokensCache.set(refresh_token, access_token);
//   return access_token;
// }

// type WithClientFn<T> = (client: Wretcher) => Promise<T>;
// const withClient = <T>(fn: WithClientFn<T>) => (refreshToken: string) => attemptP(async () => {
//   const token = await accessToken(refreshToken);
//   const client = api
//     .headers({Authorization: "Bearer " + token})
//     .url("/api/v3");

//   return fn(client);
// });

// export const activities = (query: object = {}) => withClient(client =>
//   client.url('/activities')
//     .query(query)
//     .get()
//     .json<Activity[]>()
// );

// // API calls
// // const profile = (client: Wretcher) => client
// //   .url('/authlete')
// //   .get()
// //   .json<Strava.Athlete>();

// /****************************************************************
//  *                                                              *
//  * Data                                                         *
//  *                                                              *
//  ****************************************************************/