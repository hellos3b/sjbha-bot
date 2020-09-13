import randomstring from "randomstring";
import querystring from "querystring";
import Debug from "debug";

import {basePath, client_id, auth_scopes} from "@plugins/fit/config";
import { UserSchema } from "../../db/UserCollection";

const debug = Debug("c/fit:user-auth")

export default class Auth {
  public readonly id: string;
  public readonly password: string;

  private _stravaId: string;
  private _refreshToken: string;

  protected constructor(
    id: string, password: string = randomstring.generate(), 
    stravaId: string= "", refreshToken: string=""
  ) {
    this.id = id;
    this.password = password;
    this._stravaId = stravaId;
    this._refreshToken = refreshToken;
  }

  /** Athlete ID for strava requests */
  get stravaId() { 
    return this._stravaId; 
  }

  /** Refresh token from strava, used to gain an access token in oauth grant flow */
  get refreshToken() { 
    return this._refreshToken; 
  }

  get isConnected() {
    return !!this.refreshToken;
  }

  get authUrl() {
    const authParams = querystring.stringify({
      client_id       : client_id, 
      redirect_uri    : basePath + "/accept", 
      scope           : auth_scopes, 
      state           : this.id + "." + this.password,
      response_type   : 'code',
      approval_prompt : 'force'
    })
  
    return 'http://www.strava.com/oauth/authorize?' + authParams
  }

  public linkToStrava = (stravaId: string, refreshToken: string) => {
    debug(`linking account to to strava->%o`, {stravaId, refreshToken});

    this._stravaId = stravaId;
    this._refreshToken = refreshToken;
  }

  public static init(discordId: string) {
    return new Auth(discordId);
  }

  public static fromDb(user: UserSchema) {
    return new Auth(
      user.discordId,
      user.password,
      user.stravaId,
      user.refreshToken
    )
  }
}