import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";

import type {Authentication, Activity} from "./responses";
import {client_id, client_secret} from "../../config";
import {AsyncClient} from "@packages/async-client";
import {Unauthorized} from "@packages/common-errors";
import { UserDTO } from "../db/db-user";

const StravaClient = (token: string): AsyncClient => AsyncClient({
  baseURL: 'https://www.strava.com/api/v3',
  headers: {"Authorization": "Bearer " + token}
});

/**
 * Creates an authorized Strava client for a user
 * @param refresh_token The token for an authorized user
 */
export const createClient = (user: UserDTO) => {
  const auth = (token: string) => AsyncClient()
    .post<Authentication>('https://www.strava.com/oauth/token', {
      grant_type    : "refresh_token",
      refresh_token : token,
      client_id, client_secret    
    });

  return pipe(
    TE.fromEither(getToken(user)),
    TE.chain(auth),
    TE.map(res => StravaClient(res.access_token))
  );
}

// todo: User concern
const getToken = (user: UserDTO) => pipe(
  O.fromNullable(user.refreshToken),
  E.fromOption(Unauthorized.lazy("User does not have a refresh token"))
);

type ActivityQuery = {
  /** Epoch time */
  before?: number;
  /** Epoch time */
  after?: number;
  /** Defaults to 1 */
  page?: number;
  per_page?: number;  
}

export const getActivites = (params: ActivityQuery) => flow(
  createClient,
  TE.chain(_ => _.get<Activity[]>('/activities', params))
)



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