import bastion from "@services/bastion";
import api from "@services/express";
import {paramRouter} from "@services/bastion/middleware";

import * as bot from "./src/bot/controller";

const botRouter = bastion.Router();

botRouter.use("help", bot.help);
botRouter.use("auth", bot.auth);
botRouter.use("profile", bot.profile);
botRouter.use("leaderboard", bot.leaderboard);
botRouter.use("week", bot.postWeeklyProgress);

bastion.use("fit", paramRouter(botRouter, {default: "help"}));