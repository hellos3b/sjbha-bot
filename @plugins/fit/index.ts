import bastion from "@services/bastion";
import app from "@services/express";
import {paramRouter} from "@services/bastion/middleware";

import * as bot from "./bot/controller";

const botRouter = bastion.Router();

botRouter.use("help", bot.help);
botRouter.use("auth", bot.auth);
botRouter.use("profile", bot.profile);
botRouter.use("leaderboard", bot.leaderboard);
botRouter.use("week", bot.postWeeklyProgress);

bastion.use("fit", paramRouter(botRouter, {default: "help"}));

import * as auth from "./api/AuthController";
import * as profile from "./api/ProfileController";
import { url_accept } from "./config";

// strava authentication
app.get(url_accept, auth.authAccept);
app.post("/fit/api/login", auth.authLogin);

// fit web API
app.get("/fit/api/webhook", auth.verifyHook);
app.post("/fit/api/webhook", profile.postActivity);
app.post("/fit/api/hr", auth.validateToken, profile.updateMaxHR);
app.get("/fit/api/hr", auth.validateToken, profile.getMaxHR);