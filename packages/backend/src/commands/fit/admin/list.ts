import { Instance, MessageHandler } from '@sjbha/app';

import * as format from '@sjbha/utils/string-formatting';
import { DateTime } from 'luxon';
import { table } from 'table';

import * as Workout from '../db/workout';

export const list : MessageHandler = async message => {
  const workouts = await Workout.find ({}, { limit: 20 });

  // todo: Ensure chronological order
  const rows = await Promise.all (workouts.map (formatRow));

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

const formatRow = async (workout: Workout.Workout) : Promise<string[]> => {
  const username = await Instance.findMember (workout.discord_id)
    .then (member => member.displayName)
    .catch (() => '<unknown>');
  
  const timestamp = DateTime
    .fromISO (workout.timestamp)
    .toLocal ()
    .toFormat ('hh:mma');

  return [
    workout.activity_id.toString (),
    timestamp,
    '@' + username,
    Workout.expTotal (workout.exp).toFixed (1),
    workout.activity_name
  ];
}

