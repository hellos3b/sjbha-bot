import wretch from "@services/node-wretch";
import {client_id, client_secret} from "@plugins/fit/config";
import {AuthResponse} from "./types";

import * as F from "fluture";
import { error, UNEXPECTED } from "../utils/errors";

const api = wretch().url('https://www.strava.com')
const failedRequest = () => error(UNEXPECTED)("Unable to fetch from Strava")

/**
 * Get refresh token, use it for a user's first time in authenticating
 * 
 * @param code 
 */
export async function getRefreshToken(code: string) {
  return api.url('/oauth/token')
    .post({
      code,
      client_id,
      client_secret,
      grant_type: "authorization_code"
    })
    .json<AuthResponse>();
}

/**
 * If you already have gotten the refresh token, 
 * you can use this to get a temporary access token
 * 
 * @param code 
 */
export async function getAccessToken(refreshToken: string) {
  const res = await api.url('/oauth/token')
    .post({
      client_id: client_id,
      client_secret: client_secret,
      refresh_token : refreshToken,
      grant_type    : "refresh_token"
    })
    .json<AuthResponse>();

  return res.access_token;
}

export const getRefreshTokenF = (code: string) => 
  F.attemptP(() => getRefreshToken(code))
    .pipe (F.mapRej (failedRequest));