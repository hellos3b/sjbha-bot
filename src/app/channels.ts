import {IS_PRODUCTION} from "./env";

const production = {
  strava: "450913008323919872",
  shitpost: "506911331257942027",
  bot_admin: "430517752546197509"
};

type Channels = typeof production;

const development: Channels = {
  strava: "531745959449853997",
  shitpost: "813566960612802561",
  bot_admin: "530597070558461972"
};

const channels = IS_PRODUCTION ? production : development;
export default channels;