import { Message, Client } from 'discord.js';
import { table } from 'table';
import { env } from '@sjbha/app';
import * as format from '@sjbha/utils/Format';

import { Workouts, Workout } from '../db/workout';
import { none, option } from 'ts-option';

export async function list (message: Message) : Promise<void> {
  const workouts = await Workouts ().limit (20).find ();

  // todo: Ensure chronological order
  const rows = await Promise.all (workouts.map (formatRow (message.client)));

  if (!rows.length) {
    message.reply ('No recent workouts');

    return;
  }
  
  message.channel.send (
    format.code (table (rows, {
      drawHorizontalLine: () => false,
      drawVerticalLine:   () => false
    }))
  ); 
}

const formatRow = (client: Client) => async (workout: Workout.Model) : Promise<string[]> => {
  const member = await client.guilds.fetch (env.SERVER_ID)
    .then (guild => guild.members.fetch (workout.discord_id))
    .then (option, () => none);

  const username = member.map (m => m.displayName).getOrElseValue ('<unknown>');
  
  const timestamp = workout.started.toFormat ('hh:mma');

  return [
    workout.activity_id.toString (),
    timestamp,
    '@' + username,
    workout.totalExp.toFixed (1),
    workout.activity_name
  ];
}