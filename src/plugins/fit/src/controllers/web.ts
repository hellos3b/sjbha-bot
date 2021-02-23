import {map, chainW, fromEither, mapLeft} from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";

import router from "@app/express";
import * as express from "express";
import * as Error from "@packages/common-errors";

import * as auth from "../app/authentication";
import { DecodeError } from "@packages/common-errors";

// todo: move to frontend project
router.get("/fit/accepted", (req, res) => {
  res.send("Congrats!");
});

/**
 * Accept a token auth from strava.
 * After a user clicks "Authorize" on the strava page, it redirects to use
 * with a code we can use to get a refresh token
 */
router.get("/fit/accept", (req, res) => {
  const body = pipe(
    t.interface({
      code: t.string, 
      state: t.string
    }).decode(req.query),
    E.mapLeft
      (DecodeError.fromError)
  );

  pipe(
    fromEither(body),
    chainW
      (_ => auth.acceptToken(_.code, _.state)),
    map 
      (() => res.redirect("/fit/accepted")),
    mapLeft 
      (err => {
        switch (err.constructor) {
          case Error.UnauthorizedError: { 
            return res.status(401).send("There was a problem accepting your strava auth code. Try running !fit auth and trying again"); 
          }
          case Error.DecodeError: { 
            return res.status(400).send("Invalid token"); 
          }
          default: {
            console.error("Failed to accept token: ", err);
            res.status(500).send("Internal error happened");
          }
        }
      }),
  )();
});

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