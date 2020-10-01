import type {Auth, AuthorizedUser} from "./collection";

import * as R from "ramda";
import * as u from "./user";

import {stringify as querystring} from "querystring";
import {basePath, url_login} from "@plugins/fit/config";
import { AuthResponse } from "../strava-client/types";

const loginUrl = basePath + url_login;

export const toToken = (user: Auth) => user.discordId + "." + user.password;

export const decodeToken = (token: string): Auth => {
  const [discordId, password] = token.split(".");
  return <const>{discordId, password};
}

export const getStravaUrl = (user: Auth) => 
  loginUrl + "?" + querystring({ token: toToken(user) });

export const setStravaData = ({refresh_token, athlete}: AuthResponse) => R.pipe(
  u.setStravaAuth(athlete.id, refresh_token),
  u.setGender(athlete.sex)
);