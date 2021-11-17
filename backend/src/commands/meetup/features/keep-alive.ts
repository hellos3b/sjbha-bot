import schedule from 'node-schedule';
import { ThreadChannel } from 'discord.js';
import { Instance } from '@sjbha/app';

import * as db from '../db/meetups';

// Start the scheduler
export async function init() : Promise<void> {
  // Check every hour
  schedule.scheduleJob ('10 * * * *', openAllThreads);
}

// Iterate over all Live meetups
// and make sure their thread is still open
async function openAllThreads () {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  for (const meetup of meetups) {
    const channel = await Instance.fetchChannel (meetup.threadID);

    if (channel.isThread ()) {
      (channel as ThreadChannel).setArchived (false);
    }
  }
}