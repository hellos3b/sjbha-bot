import { formatDistance } from "date-fns";
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageReplyOptions } from "discord.js";
import * as Interaction from "../interaction";
import { interactionFailed } from "../errors";
import { assertDefined } from "../prelude";
import { broadcast, World } from "../world";
import { env } from "../environment";

interface note {
   moderator: string;
   userId: string;
   note: string;
   timestamp: Date;
}

const collection_name = "mod-notes";

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

const makeNoteSavedAnnouncement = ({ userId, note, modname }: noteAnnouncementProps): MessageReplyOptions => ({
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
      .then (async _ => {
         await interaction.channel?.send ({ content: text });
      })
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
      .collection<note> (collection_name)
      .insertOne (note);

   const response = document
      .then (_ => makeSavedNoteReply ({
         note: note.note,
         userId: user.id, 
         ephemeral: interaction.channelId !== env.CHANNEL_ADMIN
      }));

   const announcement = response.then (_ => makeNoteSavedAnnouncement ({
      userId: user.id,
      modname: interaction.user.username,
      note: note.note
   }));
   
   Promise
      .all ([response, announcement])
      .then (([r, a]) => interaction.reply (r).then (_ => broadcast (world, env.CHANNEL_BOT_LOG, a)))
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
      .collection<note> (collection_name)
      .find ({ userId: user.id })
      .toArray ();

   notes
      .then (notes => makeUserNotesReply ({
         username: user.username,
         notes,
         now: new Date (),
         ephemeral: interaction.channelId !== env.CHANNEL_ADMIN
      }))
      .then (_ => interaction.reply (_), interactionFailed);
};

const { commandType, permissions, optionType } = Interaction;
export const mod = Interaction.make ({
   config: [{
      name: "mod",
      description: "Commands meant to help make modding easier",
      type: commandType.slash,
      default_member_permissions: permissions.kick,
      options: [
         {
            type: optionType.sub_command,
            name: "log",
            description: "Log a note about a specific user",
            options: [{
               type: optionType.user,
               name: "user",
               description: "The user this note is about",
               required: true
            }, {
               type: optionType.string,
               name: "note",
               description: "The note you want to save for this user",
               required: true
            }]
         },

         {
            type: optionType.sub_command,
            name: "echo",
            description: "Play simon says with bored bot (hey, dont abuse this!)",
            options: [{
               type: optionType.string,
               name: "text",
               description: "The text that bored bot will repeat",
               required: true
            }]
         },

         {
            type: optionType.sub_command,
            name: "lookup",
            description: "Look up notes that have been saved for a user",
            options: [{
               type: optionType.user,
               name: "user",
               description: "The user to lookup",
               required: true
            }]
         }
      ]
   }],

   handle: (interaction, world) => {
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
   }
});