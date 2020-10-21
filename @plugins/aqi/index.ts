import type {Request} from "@services/bastion";
import type {MessageOptions} from "discord.js";

import {message$, cmd, noParam, param} from "@services/bastion/fp";
import * as R from "ramda";
import * as F from "fluture";

import {stringify} from "querystring";
import {getAverages} from "./src/parse";
import * as embed from "./src/embed";
import { SensorIds } from "./config";

type Embed = MessageOptions["embed"];


const postAverages = (req: Request) => {
  const send = (embed: Embed) => req.reply({embed});
  const error = () => req.reply("Failed");

  R.pipe(
    getAverages,
    F.map (embed.create),
    F.fork (error) (send)
  )()
};

const postMapLink = (req: Request) => {
  const ids = SensorIds.join("|");
  const url = `https://www.purpleair.com/map?opt=1/i/mAQI/a10/cC0&show=${ids}#10.3/37.3945/-121.9999`;
  req.reply(`These are the sensors used by the \`!aqi\` command: \n<${url}>`)
}

const aqi$ = message$.pipe(cmd("aqi"));

aqi$.pipe(noParam()).subscribe(postAverages);
aqi$.pipe(param('sensors')).subscribe(postMapLink);