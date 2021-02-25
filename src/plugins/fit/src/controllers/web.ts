import {map, chainW, fromEither, mapLeft} from "fp-ts/TaskEither";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";

import * as env from "@app/env";
import router from "@app/express";
import {broadcast} from "@app/bot";
import channels from "@app/channels";

import * as auth from "../app/authentication";
import * as addWorkout from "../app/add-workout";
import * as activity from "../views/activity";

import { UnauthorizedError, ConflictError, DecodeError } from "@packages/common-errors";

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
  const BodyT = t.interface({
    code: t.string, 
    state: t.string
  });

  const body = pipe(
    BodyT.decode(req.query),
    E.mapLeft (DecodeError.fromError)
  );

  pipe(
    fromEither(body),
    chainW (_ => auth.acceptToken(_.code, _.state)),
    map  (() => res.redirect("/fit/accepted")),
    mapLeft (err => {
      switch (err.constructor) {
        case UnauthorizedError: { 
          return res.status(401).send("There was a problem accepting your strava auth code. Try running !fit auth and trying again"); 
        }
        case DecodeError: { 
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

// Keep track of recently posted workouts,
// and ignore if they try to post a second time
let recent_ids: string[] = [];
const addRecentId = (id: string) => {
  recent_ids = [id, ...recent_ids.slice(0, 100)];
}

// mini util to await a certain milliseconds
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * When a user records an activity on strava, Strava sends a POST request to this url
 * We want to load all the information, add it to the user, and publish it
 */
router.post("/fit/api/webhook", async (req, res) => {
  const BodyT = t.interface({
    owner_id: t.string,
    object_id: t.string,
    aspect_type: t.literal("create") // note: if we want to expand to catching updates, we have to change this
  });

  type Body = t.TypeOf<typeof BodyT>;

  const checkWasntPosted = (body: Body) => recent_ids.includes(body.object_id) 
    ? E.left(ConflictError.create("Activity ID already exists", body))
    : E.right(body);

  const body = pipe(
    BodyT.decode(req.body),
    E.chainW (checkWasntPosted)
  );

  const post = pipe(
    fromEither (body),
    chainW (_ => {
      addRecentId(_.object_id);
      return addWorkout.save(_.owner_id, _.object_id);
    }),
    map (_ => activity.render(_.user, _.result, _.workout, _.week)),
    chainW (broadcast(channels.strava))
  );

  // Close the request, we continue onwards without !
  res.send("Thanks!");

  // Wait 5 minutes before submitting so users can edit title
  // todo: lsiten to "Update" events and update the messages instead
  env.IS_PRODUCTION && await wait(5 * 60 * 1000);

  post();
});

/**
 * In order to sign up for a webhook for strava, you need to accept the "hub challenge"
 * by echo-ing back the random string they pass in.
 * 
 * @see https://developers.strava.com/docs/webhooks/
 * @query `hub.challenge`
 */
router.get("/fit/api/webhook", (req, res) => {
  const challenge = <string>req.query["hub.challenge"];
  res.send({"hub.challenge": challenge});
});