import * as express from "express";

import * as t from "runtypes";
import {Either} from "purify-ts";

import * as strava from "../strava-client/oauth";
import * as userAuth from "../user/auth";
import * as uc from "../user/collection";
import * as R from "ramda";
import * as F from "fluture";

import { NotConnected, Unauthorized } from "../errors";

import { getAuthorizedUser, saveAuth } from "../domain/auth/AuthRepository";
import { getUser, saveUser } from "../domain/user/UserRepository";
import { getAuthInfo } from "../strava-client";
import { debug, url_settings } from "../config";
import { AuthResponse } from "../strava-client/types";

// We extend request object for authorized requests
interface AuthorizedRequest extends express.Request {
  discordId?: string;
}

const apply = <T extends (...args: any[])=>any>(fn: T) => (data: Parameters<T>): ReturnType<T> => fn.apply(null, data);

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

    case NotConnected.type: {
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

const Accept = t.Record({
  code: t.String,
  state: t.String
});

type AcceptT = t.Static<typeof Accept>;

const fetchAccounts = (body: AcceptT) => F.both 
  (uc.getAuthorized (userAuth.decodeToken (body.state)))
  (strava.getRefreshTokenF (body.code));

const linkUserAccount = (authUser: uc.AuthorizedUser, stravaAuth: AuthResponse) => R.pipe(
  userAuth.setStravaData(stravaAuth),
  uc.update
)(authUser);

export async function authAccept(req: express.Request, res: express.Response) {
  const Redirect = () => res.redirect(url_settings);
  const Error = (d?: any) =>  res.status(401).send("Something failed");

  const accept = R.pipe(
    fetchAccounts,
    F.chain (apply (linkUserAccount)), 
    F.fork (Error) (Redirect)
  );

  Either.encase(() => Accept.check(req.query))
    .ifLeft(Error)
    .ifRight(accept);
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