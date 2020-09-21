import bastion from "@services/bastion";
import app from "@services/express";
import channels from "@app/channels";
import {message$, cmd, noParam, param, restrict} from "@services/bastion/stream";
// import {restrict, paramRouter} from "@services/bastion/middleware";
import * as bot from "./bot";

const fit$ = message$.pipe(cmd("fit"));
const strava$ = fit$.pipe(restrict(channels.strava));
const admin$ = fit$.pipe(restrict(channels.bot_admin));

strava$.pipe(noParam())
  .subscribe(bot.help)

strava$.pipe(param("help"))
  .subscribe(bot.help);

strava$.pipe(param("auth"))
  .subscribe(bot.auth);

strava$.pipe(param("profile"))
  .subscribe(bot.profile);

strava$.pipe(param("exp"))
  .subscribe(bot.exp);

strava$.pipe(param("leaderboard"))
  .subscribe(bot.leaderboard);

import {postWeeklyProgress} from "./bot/weekly";

fit$.pipe(
  param("post-week"),
  restrict(channels.bot_admin)
).subscribe(postWeeklyProgress);

import * as auth from "./api/AuthController";
import * as profile from "./api/ProfileController";
import { url_accept } from "./config";

// strava authentication
app.post("/fit/api/login", auth.authLogin);
app.get(url_accept, auth.authAccept);

// fit web API
app.get("/fit/api/webhook", auth.verifyHook);
app.post("/fit/api/webhook", profile.postActivity);
app.post("/fit/api/hr", auth.validateToken, profile.updateMaxHR);
app.get("/fit/api/hr", auth.validateToken, profile.getMaxHR);