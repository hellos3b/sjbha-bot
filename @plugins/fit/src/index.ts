// // Set configuration variables
// export {setConfig as config} from "../config";
// export {default as scheduler} from "./scheduler";


// // Bot code
// import * as bastion from "@bored/bastion";
// import {routeParam} from "@bored/bastion-toolkit";
// import * as bot from "./bot/controller";

// const botRouter = new bastion.Router();

// botRouter.use("help", bot.help);
// botRouter.use("auth", bot.auth);
// botRouter.use("profile", bot.profile);
// botRouter.use("leaderboard", bot.leaderboard);
// botRouter.use("week", req => bot.postWeeklyProgress(req.bastion));

// export const command = routeParam(botRouter, {default: "help"});


// // Web controllers
// import path from "path";
// import * as express from "express";
// import * as auth from "./web/AuthController";
// import * as profile from "./web/ProfileController";
// import Debug from "debug";

// const debug = Debug("c/fit:web");

// const VIEWS_DIR = path.join(__dirname, "..", "public");
// const router = express.Router();

// router.use((req, res, next) => {
//   debug(`${req.method} %o`, req.url);
//   next();
// })

// // strava authentication
// router.get("/accept", auth.authAccept);
// router.get("/webhook", auth.verifyHook);
// router.post("/login", auth.authLogin);

// // fit web API
// router.post("/webhook", profile.postActivity);
// router.post("/update-hr", auth.validateToken, profile.updateMaxHR)

// // render UI
// router.use(express.static(VIEWS_DIR));
// router.get("/*", (req, res) => res.sendFile("index.html", { root : VIEWS_DIR }))

// export {router};