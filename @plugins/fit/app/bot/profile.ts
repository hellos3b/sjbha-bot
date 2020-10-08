import * as R from "ramda";
import * as F from "fluture";

import {Request} from "@services/bastion";
import * as User from "../../models/user";

import {MessageOptions} from "discord.js";
import { createProfileEmbed } from "./profile-embed";

type Embed = MessageOptions["embed"];

// 
// Display an over view of stats 
//
export const profile = async (req: Request) => {
  const message = await req.reply("One second, let me get that for you");

  const reply = (embed: Embed) => {
    message.delete();
    req.reply({embed});
  }

  const errorHandle = (data: any) => req.reply("oops");

  R.pipe(
    User.getById,
    F.chain (User.toPublicUser),
    F.map   (createProfileEmbed),
    F.fork  (errorHandle) (reply)
  )(req.author.id)
}