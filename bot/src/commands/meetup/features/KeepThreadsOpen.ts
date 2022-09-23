import schedule from 'node-schedule';
import * as Discord from 'discord.js';
import { Log } from '../../../app';

import * as db from '../db/meetups';

const log = Log.make ('fit:keep-threads-open');

// Start the scheduler
export async function startSchedule(client: Discord.Client) : Promise<void> {
  // Check every hour
  schedule.scheduleJob (
    '10 * * * *', 
    () => {
      Log.runWithContext (() => {
        log.info ('Scheluded: Checking all threads top be open');
        openAllThreads (client);
      });
    }
  );
}

// Iterate over all Live meetups
// and make sure their thread is still open
export const openAllThreads = async (client: Discord.Client) : Promise<void> => {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  for (const meetup of meetups) {
    const channel = await client.channels.fetch (meetup.threadID);

    if (channel?.isThread ()) {
      await channel.setArchived (false);
    }
  }
}