import schedule from 'node-schedule';
import * as Discord from 'discord.js';

import * as db from '../db/meetups';

// Start the scheduler
export async function startSchedule(client: Discord.Client) : Promise<void> {
  // Check every hour
  schedule.scheduleJob (
    '10 * * * *', 
    () => openAllThreads (client)
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