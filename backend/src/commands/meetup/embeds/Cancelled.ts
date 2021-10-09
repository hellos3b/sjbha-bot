import { MessageEmbed } from 'discord.js';
import * as db from '../db/meetups';

export function Cancelled (meetup: db.Meetup, reason: string) : MessageEmbed {
  return new MessageEmbed ({
    title:       '📅  **CANCELLED**: ~~' + meetup.title + '~~',
    color:       '#9b3128',
    description: `> ${reason}`
  });
}