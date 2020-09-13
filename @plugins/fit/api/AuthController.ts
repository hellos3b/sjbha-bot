import * as express from "express";
import { NotConnected, Unauthorized } from "../errors";

import { getAuthorizedUser, saveAuth } from "../domain/auth/AuthRepository";
import { getUser, saveUser } from "../domain/user/UserRepository";
import { getAuthInfo } from "../strava-client";
import { debug, url_settings } from "../config";

// We extend request object for authorized requests
interface AuthorizedRequest extends express.Request {
  discordId?: string;
}

/**
 * Middleware that checks the authorization header for a valid token 
 */
export async function validateToken(req: AuthorizedRequest, res: express.Response, next: ()=>void) {
  const token = req.headers.authorization;
  
  try {
    if (!token) throw new Unauthorized("No token provided");

    const [discordId, password] = token.split(".");
    await getAuthorizedUser(discordId, password);

    req.discordId = discordId;

    next();
  } catch (e) {
    switch (e.name) {
    case Unauthorized.type: {
      res.status(401).send({message: e.message})
      break;
    };

    default: {
      console.error(e);
      res.status(500)
        .send({message: "Something unexpected went wrong"})        
    }
    }
  }
}

/**
 * POST request. Validates the user `token` from the front-end, 
 * and if accepted will send back the authorization url if user isn't connected
 */
export async function authLogin(req: AuthorizedRequest, res: express.Response) {
  const token = String(req.body["token"]);

  if (!token) {
    debug("Missing connectHash");
    return res.status(401).json({error: "Missing Token"});
  }

  const [discordId, password] = token.split(".");

  try {
    const user = await getAuthorizedUser(discordId, password);

    res.json({
      discordId, token,
      isConnected: user.isConnected,
      authUrl: user.authUrl
    });
  } catch (e) {
    debug("Unable to connect user to strava auth. Error: %o", e);
    // todo: make this a page
    res.status(401).json({
      message:`There is a problem with the URL, please try to use !strava auth again`
    });
  }
}


/** 
 * Redirect landing from authorization grant flow
 * 
 * @query `code`
 * @query `state`
 */
export async function authAccept(req: express.Request, res: express.Response) {
  const code = <string>req.query.code;
  const connectHash = <string>req.query.state;

  if (!code || !connectHash) return res.send("Invalid token");

  const [discordId, password] = connectHash.split(".");
  debug("Accepting token for %o", discordId);

  try {
    const [auth, profile, strava] = await Promise.all([
      getAuthorizedUser(discordId, password),
      getUser(discordId),
      getAuthInfo(code)
    ]);

    auth.linkToStrava(String(strava.athlete.id), strava.refresh_token);
    profile.updateGender(strava.athlete.sex);

    await Promise.all([saveAuth(auth), saveUser(profile)])

    res.redirect(url_settings);
  } catch (e) {
    switch (e.name) {
    case NotConnected.type: return res.send(`Something went wrong when trying to authorize your acount. Try using !strava auth once again`)

    default:
      debug("Token acceptance failed");
      console.error(e);

      return res.send("Something unexpected went wrong and your account couldn't be connected");

    }
  }
}


/**
 * In order to sign up for a webhook for strava, you need to accept the "hub challenge"
 * by echo-ing back the random string they pass in.
 * 
 * @see https://developers.strava.com/docs/webhooks/
 * @query `hub.challenge`
 */
export async function verifyHook(req: express.Request, res: express.Response) {
  const challenge = <string>req.query["hub.challenge"];
  res.send({"hub.challenge": challenge});
}