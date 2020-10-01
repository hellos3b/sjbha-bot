import type {Auth, Authorized} from "./collection";

import * as R from "ramda";

import {stringify as querystring} from "querystring";
import {basePath, url_login} from "@plugins/fit/config";
import { AuthResponse } from "../strava-client/types";

export {
  insertNewUser,
  fetch,
  getOrCreate,
  getAuthorized,
  update,
  Authorized as AuthorizedUser
} from "./collection";

/** Gets the `hash token` for the User that's used to authenticate web requests */
export const toToken = (user: Auth) => user.discordId + "." + user.password;

/** Get the discord ID and password out of a `hash token` */
export const decodeToken = (token: string): Auth => {
  const [discordId, password] = token.split(".");
  return <const>{discordId, password};
}

/** The link that the user uses to initiate an authorization flow */
export const getAuthLink = (user: Auth) => 
  basePath + url_login + "?" + querystring({ token: toToken(user) });

/** Update the oauth data for a user */
export const setStravaAuth = (stravaId: number, refreshToken: string) => 
  (user: Authorized): Authorized => ({
    ...user,
    stravaId: String(stravaId),
    refreshToken
  })

/** Update the user's gender */
export const setGender = (gender: string) => 
  (user: Authorized): Authorized => ({
    ...user, gender
  });

/** When a user first links to strava, update the model */
export const linkStravaAccount = ({refresh_token, athlete}: AuthResponse) => R.pipe(
  setStravaAuth(athlete.id, refresh_token),
  setGender(athlete.sex)
);