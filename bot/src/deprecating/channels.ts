import { env } from "../environment";

const production = {
   strava:            "450913008323919872",
   shitpost:          "506911331257942027",
   bot_admin:         "430517752546197509",
   meetups_directory: "950985725334138880",
   meetups:           "358442118928400384",
   showdown:          "911438085781327913"
};

type Channels = typeof production;

const devServer = {
   bot1: "861815778281259008",
   bot2: "861816839197950002"
};

const development: Channels = {
   strava:            devServer.bot1,
   shitpost:          devServer.bot1,
   bot_admin:         devServer.bot1,
   meetups:           devServer.bot1,
   meetups_directory: "876983154924204043",
   showdown:          devServer.bot1
};

export const channels = env.NODE_ENV === "PRODUCTION" ? production : development;