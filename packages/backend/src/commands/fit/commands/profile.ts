import { MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { Maybe } from 'purify-ts';
import { add } from 'ramda';

import * as User from '../db/user';
import * as Workout from '../db/workout';

import { getRank } from '../common/ranks';

export const profile : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t set up with the Strava bot');

    return;
  }

  // Profile includes last 30 days
  const workouts = await Workout.find ({ 
    discord_id: user.discordId,
    timestamp:  Workout.between (Interval.before (DateTime.local (), { days: 30 }))
  });

  const member = Maybe.fromNullable (message.member);
  const embed = new MessageEmbed ();

  embed.setColor (
    member.mapOrDefault (m => m.displayColor, 0xcccccc)
  );

  embed.setAuthor (
    member.mapOrDefault (m => m.displayName, message.author.username),
    message.author.displayAvatarURL ()
  );

  const rank = getRank (user.fitScore);
  const weekly = workouts
    .map (w => Workout.expTotal (w.exp))
    .reduce (add, 0);

  embed.addField ('Rank', rank, true);
  embed.addField ('Total EXP', roundExp (user.xp), true);
  embed.addField ('Weekly EXP', roundExp (weekly), true);

  embed.addField ('Last Activity', 'WOOT', true);

  message.channel.send (embed);
}

const roundExp = (amt: number) => 
  (amt >= 1000) ? (amt / 1000).toFixed (1) + 'k'
    : amt.toFixed (1)