import { MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { Maybe } from 'purify-ts';

import * as User from '../db/user';
import * as Workout from '../db/workout';

export const profile : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!user) {
    message.reply ('You aren\'t set up with the Strava bot');

    return;
  }

  // Profile includes last 30 days
  const workouts = await Workout.find (
    { discord_id: user.discordId },
    Interval.before (DateTime.local (), { days: 30 })
  );

  const member = Maybe.fromNullable (message.member);
  const embed = new MessageEmbed ();

  embed.setColor (
    member.mapOrDefault (m => m.displayColor, 0xcccccc)
  );

  embed.setAuthor (
    member.mapOrDefault (m => m.displayName, message.author.username),
    message.author.displayAvatarURL ()
  );

  embed.addField ('Rank', 'Some Bird', true);
  embed.addField ('Total EXP', '1.5k', true);
  embed.addField ('Weekly EXP', '130', true);

  embed.addField ('Last Activity', 'WOOT', true);

  message.channel.send (embed);
}