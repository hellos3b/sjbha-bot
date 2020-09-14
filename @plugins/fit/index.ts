import bastion from "@services/bastion";
import app from "@services/express";
import channels from "@app/channels";
import {restrict, paramRouter} from "@services/bastion/middleware";
import * as bot from "./bot";

const router = bastion.Router();

router.use("help", bot.help);
router.use("auth", bot.auth);
router.use("profile", bot.profile);
router.use("exp", bot.exp);
router.use("leaderboard", bot.leaderboard);

bastion.use("fit", restrict(channels.strava), paramRouter(router, {default: "help"}));

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