import { MessageEmbed } from 'discord.js';
import * as db from '../db/meetups';

export function Ended (meetup: db.Meetup, reason: string) : MessageEmbed {
  return new MessageEmbed ({
    title:       '📅  **todo ended**',
    color:       '#9b3128',
    description: `> ${reason}`
  });
}