import wretch from "@services/node-wretch";
import {client_id, client_secret} from "@plugins/fit/config";
import {AuthResponse} from "./types";

const api = wretch().url('https://www.strava.com')

export default class StravaClient {
  /**
   * Get refresh token, use it for a user's first time in authenticating
   * 
   * @param code 
   */
  getRefreshToken = async (code: string) => {
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
  getAccessToken = async (refreshToken: string) => {
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
}