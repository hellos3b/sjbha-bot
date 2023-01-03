import * as format from "../../../deprecating/Format";
import { Message } from "discord.js";

/**
 * Show a help string 
 */
export async function help (message: Message) : Promise<void> {
   const help = format.help ({
      commandName: "meetup",
      description: "Create meetups. If used just !meetup, gives you link to create a meetup",
      usage:       "!meetup <command>",
      commands:    {
         "create": "Creates a meetup and starts a thread"
      },
      sections: [
         {
            title:    "Commands (In Meetup Thread)",
            commands: {
               "edit":     "Update any fields on the meetup",
               "cancel":   "Cancels the meetup and nobody can RSVP",
               "announce": "Ping all RSVPs "
            }
         }
      ]
   });

   message.channel.send (help);
}