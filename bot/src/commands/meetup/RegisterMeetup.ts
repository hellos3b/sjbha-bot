import { match, __ } from "ts-pattern";
import * as Discord from "discord.js";
import * as Command from "../../deprecating/Command";
import { startsWith, inChannel } from "../../deprecating/CommandFilter";

import { create } from "./commands/create";
import { cancel } from "./commands/cancel";
import { edit } from "./commands/edit";
import { announce } from "./commands/announce";
import { help } from "./commands/help";
import { refresh } from "./AdminCommands";

import * as UpdateRsvps from "./features/UpdateRsvps";
import * as Directory from "./features/Directory";
import * as EndMeetups from "./features/EndMeetup";
import * as Render from "./features/RenderAnnouncement";
import * as KeepThreadsOpen from "./features/KeepThreadsOpen";

import { getMeetup } from "./routes/get-meetup";
import { redirectGoogleCalendar } from "./routes/gcal";
import { env } from "../../environment";

const meetupGlobal = Command.filtered ({
   filters: [
      startsWith ("!meetup"),
      inChannel (env.CHANNEL_MEETUPS)
   ],

   callback: message =>
      match (Command.route (message))
         .with ("create", () => create (message))
         .with ("help", () => help (message))
         .with ("edit", () => message.reply ("Editing a meetup is now done inside the Meetup thread"))
         .with ("cancel", () => message.reply ("Canceling a meetup is now done inside the Meetup thread"))
         .with ("mention", () => message.reply ("Mentioning a meetup is now done inside the Meetup thread"))
         .with (__.nullish, () => message.reply ("Click here to create a meetup: https://hellos3b.github.io/sjbha-bot/meetup"))
         .otherwise (() => message.reply ("Click here to create a meetup: https://hellos3b.github.io/sjbha-bot/meetup"))
});

const meetupWrongChannel = Command.filtered ({
   filters: [
      startsWith ("!meetup"),
      message => !message.channel.isThread (),
      message => !inChannel (env.CHANNEL_MEETUPS) (message)
   ],

   callback: message => message.reply (`!meetup command is now restricted to <#${env.CHANNEL_MEETUPS}>`)
});

const meetupManage = Command.filtered ({
   filters: [
      startsWith ("!meetup"),
      message => message.channel.isThread ()
   ],

   callback: message =>
      match (Command.route (message))
         .with ("edit", () => edit (message))
         .with ("cancel", () => cancel (message))
         .with ("announce", () => announce (message))
         .with ("help", () => help (message))
         .with ("mention", () => message.reply ("Mentioning a meetup has been changed to `!meetup announce`"))
         .otherwise (() => { /** ignore */ })
});

const admin = Command.filtered ({
   filters: [
      startsWith ("$meetup"),
      inChannel (env.CHANNEL_BOT_ADMIN)
   ],

   callback: message =>
      match (Command.route (message))
         .with ("refresh", () => refresh (message))
         .otherwise (() => { /** ignore */ })
});

export const command = Command.combine (
   meetupWrongChannel,
   meetupGlobal,
   meetupManage,
   admin
);

export const startup = (client: Discord.Client): void => {
   // Keeps the announcement Embed up to date
   Render.init (client);

   // Listen to RSVP buttons and update meetup
   UpdateRsvps.startWatching (client);

   // Keeps a compact view in #meetups-directory up to date
   Directory.startListening (client);

   // Auto end meetups after a certain period
   EndMeetups.init (client);

   // Keeps threads open while a meetup is live
   KeepThreadsOpen.startSchedule (client);
};

export const routes = [
   {
      method:  "GET",
      path:    "/meetup/{id}/gcal",
      handler: redirectGoogleCalendar
   },
   {
      method:  "GET",
      path:    "/meetup/{id}",
      handler: getMeetup
   }
];