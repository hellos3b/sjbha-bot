import { formatDistance } from "date-fns";
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageOptions } from "discord.js";
import { interactionFailed, makeUnexpectedReply } from "../errors";
import { assertDefined } from "../util";
import { broadcast, World } from "../common/world";

interface note {
   moderator: string;
   userId: string;
   note: string;
   timestamp: Date;
}

const collection_name = "mod-notes";

const commandFailedReply = (): InteractionReplyOptions => ({
   content: "💀 Something unexpected happened",
   ephemeral: true
});

interface noteReplyProps {
   userId: string;
   note: string;
   ephemeral: boolean;
}

const makeSavedNoteReply = ({ userId, note, ephemeral }: noteReplyProps): InteractionReplyOptions => ({
   embeds: [{
      title:  "📝 New Mod note",
      fields: [
         { name: "User", value: `<@${userId}>` },
         { name: "Note", value: note }
      ]
   }],
   ephemeral
});

interface noteAnnouncementProps {
   userId: string;
   modname: string;
   note: string;
}

const makeNoteSavedAnnouncement = ({ userId, note, modname }: noteAnnouncementProps): MessageOptions => ({
   embeds: [{
      title: `📝 ${modname} logged a note`,
      fields: [
         { name: "User", value: `<@${userId}>` },
         { name: "Note", value: note }
      ]
   }]
});

const echo = (interaction: ChatInputCommandInteraction) => {
   const text = interaction.options.getString ("text");
   assertDefined (text, "'text' is a required option");
   
   interaction.reply ({ content: "sending echo 🤫", ephemeral: true })
      .then (_ => interaction.channel?.send ({ content: text }))
      .catch (interactionFailed);
};

const logNote = (interaction: ChatInputCommandInteraction, world: World) => {
   const user = interaction.options.getUser ("user");
   const content = interaction.options.getString ("note");

   assertDefined (user, "'user' is a required option");
   assertDefined (content, "'content' is a required option");

   const note: note = {
      moderator: interaction.user.id,
      userId: user.id,
      note: content,
      timestamp: new Date ()
   };

   const document = world.mongodb
      .collection (collection_name)
      .insertOne (note);

   const response = document
      .then (_ => makeSavedNoteReply ({
         note: note.note,
         userId: user.id, 
         ephemeral: interaction.channelId !== process.env.CHANNEL_ADMIN
      }));

   const announcement = response.then (_ => makeNoteSavedAnnouncement ({
      userId: user.id,
      modname: interaction.user.username,
      note: note.note
   }));
   
   Promise
      .all ([response, announcement])
      .then (([r, a]) => interaction.reply (r).then (_ => broadcast (world, process.env.CHANNEL_BOT_LOG, a)))
      .catch (interactionFailed);
};

interface userNotesProps {
   username: string;
   notes: note[];
   now: Date;
   ephemeral: boolean;
}

const makeUserNotesReply = ({ username, now, notes, ephemeral }: userNotesProps): InteractionReplyOptions => {
   const rows = notes.map (note => `➡️ **${formatDistance (now, note.timestamp)}**: ${note.note}`);

   return {
      embeds: [{
         title: `🔑 Notes for @${username}`,
         color: 0xedd711,
         description: (rows.length > 0)
            ? rows.join ("\n")
            : "No notes found for this user"
      }],
      ephemeral
   };
};

const lookup = (interaction: ChatInputCommandInteraction, world: World) => {
   const user = interaction.options.getUser ("user");
   assertDefined (user, "'user' is a required field");

   const notes = world.mongodb
      .collection (collection_name)
      .find ({ userId: user.id })
      .toArray ();

   notes
      .then (notes => makeUserNotesReply ({
         username: user.username,
         notes,
         now: new Date (),
         ephemeral: interaction.channelId !== process.env.CHANNEL_ADMIN
      }))
      .then (_ => interaction.reply (_), interactionFailed);
};

export const mod = (interaction: ChatInputCommandInteraction, world: World): void => {
   switch (interaction.options.getSubcommand ()) {
      case "log": 
         logNote (interaction, world);
         break;

      case "echo":
         echo (interaction);
         break;   

      case "lookup":
         lookup (interaction, world);
         break;

      default:
         throw new Error (`Unrecognized subcommand '${interaction.options.getSubcommand ()}`);

   }
};