import { match } from "ts-pattern";
import * as yup from "yup";
import { Message } from "discord.js";

import MultiChoice from "../../utils/MultiChoice";
import { MessageBuilder, inlineCode } from "../../deprecating/Format";

import * as User from "./User";

export type options =
  | "hr" | "emoji"

export const menu = async (message: Message) : Promise<void> => {
   const user = await User.findOne ({ discordId: message.author.id });

   if (!User.isAuthorized (user)) {
      message.reply ("You aren't authorized with the fitness bot! If you want to join in on the fitness channel, get started with '!fit auth'!");

      return;
   }

   const hrText = (user.maxHR)
      ? "Update Max Heartrate [Current: " + user.maxHR + "]"
      : "Set Max Heartrate (Needed for HR based exp)";

   const actions = MultiChoice.create <options> ("What would you like to do?", [
      MultiChoice.opt (hrText, "hr"),
      MultiChoice.opt (`Select Emoji Set [Current: ${user.emojis}]`, "emoji")
   ]);

   await message.channel.send (actions.toString ());
   const action = await message.channel
      .createMessageCollector ({ filter: m => m.author.id === message.author.id })
      .next.then (actions.parse);

   match (action)
      .with ("hr", _ => setMaxHeartrate (user, message))
      .with ("emoji", _ => setEmoji (user, message))
      .otherwise (() => { /** ignore */ });
};

const setMaxHeartrate = async (user: User.authorized, message: Message) => {
   const currentMax = user.maxHR || "none"; 
   const maxRecorded = user.maxRecordedHR || 0;
   const prompt = new MessageBuilder ()
      .append ("Your Max Heartrate is used to determine the intensity of your workout, and gives you double exp when you push yourself hard.")
      .space ()
      .append ("👉 **If you don't know your Max HR**, you can guesstimate it by using the formula `220 - (your age)`")
      .append ("👉 **If you want to un-set your Max HR**, then simply reply with \"remove\" and it will be removed")
      .space ()
      .append ("What do you want to set your max heartrate to?");

   await message.channel.send (prompt.toString ());
  
   const input = await message.channel
      .createMessageCollector ({ filter: m => m.author.id === message.author.id })
      .next.then (msg => msg.content.toLowerCase ());

   if (input === "remove") {
      await User.update ({
         ...user,
         maxHR: undefined
      });

      message.reply (`Your max heartrate has been updated! ${currentMax} -> none`);

      return;
   }

   try {
      const maxHR = await yup
         .number ().typeError ("Sorry, that is not a valid heartrate")
         .required ()
         .integer ("Sorry, that is not a valid heartrate")
         .min (160, `🤔 Are you sure '${input}' is correct? It may be a little too low. If you are sure, DM the bot admin to set it manually`)
         .max (220, `🤔 Are you sure '${input}' is correct? It may be a little too high. If you are sure, DM the bot admin to set it manually`)
         .moreThan (maxRecorded, `Records show that you've recorded a workout that hit at least ${maxRecorded} once, so I believe ${input} might be too low.\nIf this is a mistake, please message the bot admin and we can update it manually`)
         .validate (input, { abortEarly: true });

      await User.update ({ ...user, maxHR });
      message.reply (`Your max heartrate has been updated! ${inlineCode (currentMax)} -> ${inlineCode (maxHR)}`);
   }
   catch (e) {
      const reply = (e instanceof Error) ? e.message : "Something unexpected happened";
      message.reply (reply);
   }
};

const setEmoji = async (user: User.authorized, message: Message) => {
   const picker = MultiChoice.create ("Which emoji set do you want to use when an activity posts?", [
      MultiChoice.opt ("People - Default (🏃🚴🧘‍♂️🚶‍♂️🏋️‍♂️🧗‍♀️🤸‍♂️)", "people-default"),
      MultiChoice.opt ("People - Female (🏃‍♀️🚴‍♀️🧘‍♀️🚶‍♀️🏋️‍♀️🧗‍♂️🤸‍♀️)", "people-female"),
      MultiChoice.opt ("Objects (👟🚲☮️🥾🥾💪⛰️💦)", "objects"),
      MultiChoice.opt ("Intensity Based Faces (🙂😶😦😨🥵)", "intensity"),
      MultiChoice.opt ("Intensity Based Colors (​🟣​🟢​​🟡🟠🔴​​)", "intensity-circle")
   ]);

   await message.channel.send (picker.toString ());

   const emojis = await message.channel
      .createMessageCollector ({ filter: m => m.author.id === message.author.id })
      .next
      .then (picker.parse);

   if (emojis) {
      await User.update ({ ...user, emojis });
      message.reply (`Your Emoji Set has been updated! ${inlineCode (user.emojis)} -> ${inlineCode (emojis)}`);
   }
};
