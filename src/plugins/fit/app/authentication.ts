import * as env from "../env";
import * as TE from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import randomstring from "randomstring";
import querystring from "querystring";
import {AsyncClient} from "@packages/async-client";

import * as u from "../models/User";
import * as strava from "./strava";
import { sequenceT } from "fp-ts/lib/Apply";
import { MongoDbError, UnauthorizedError } from "@packages/common-errors";

/**
 * Creates the url for Strava that initiates the OAuth flow
 */
const authorizationUrl = (discordId: string, password: string) => {
  const authParams = querystring.stringify({
    client_id       : env.client_id, 
    redirect_uri    : env.host_name + "/fit/accept",
    scope           : "read,activity:read_all,profile:read_all", 
    state           : discordId + "." + password,
    response_type   : 'code',
    approval_prompt : 'force'
  });

  return 'http://www.strava.com/oauth/authorize?' + authParams
}

/**
 * Updates user password to a randomly generated one
 */
const updatePassword = (discordId: string) => pipe(
  u.fetch (discordId),
  TE.map 
    (user => ({...user, password: randomstring.generate()})),
  TE.chainFirstW 
    (u.save)
);

/**
 * Initializes a new user. If user exists, will just update the password
 * 
 * Returns the authorization url
 */
export const updateOrCreatePassword = (discordId: string) => pipe(
  updatePassword (discordId),
  TE.map 
    (user => authorizationUrl(user.discordId, user.password)),
  TE.orElse 
    (err => pipe(
      u.initialize(discordId, randomstring.generate()),
      TE.map (user => authorizationUrl(user.discordId, user.password))
    ))
);

/**
 * Get a refresh token for the first time, which can be re-used
 * to get an authorization token next time we need to grant access
 */
export const acceptToken = (accessToken: string, state: string): TE.TaskEither<MongoDbError | UnauthorizedError, boolean> => {
  const [discordId, password] = state.split(".");

  const getRefreshToken = () => pipe(
    AsyncClient().post<strava.API.Auth>(
      'https://www.strava.com/oauth/token', {
        grant_type    : "authorization_code",
        code          : accessToken,
        client_id     : env.client_id, 
        client_secret : env.client_secret
      }),
    TE.mapLeft
      (err => err.withMessage("Failed to generate refresh token"))
  );
  
  return pipe(
    sequenceT(TE.taskEither)
      (u.fetch(discordId), getRefreshToken()),

    // First verify if token is valid
    TE.chainFirstW
      (([user, auth]) => (user.password === password) 
        ? TE.right([user, auth])
        : TE.left (UnauthorizedError.create("Could not save refresh token for user " + discordId + ": invalid credentails"))
      ),

    // Save the auth stuff
    TE.map
      (([user, auth]): u.User => ({
        ...user,
        stravaId: auth.athlete.id.toString(),
        refreshToken: auth.refresh_token
      })),
    TE.chain
      (u.save)
  )
};