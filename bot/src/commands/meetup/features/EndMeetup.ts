import { DateTime } from 'luxon';
import schedule from 'node-schedule';
import * as Discord from 'discord.js';
import { Log } from '@sjbha/app';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';

const log = Log.make ('fit:end-meetup');

// Start the scheduler
export async function init(client: Discord.Client) : Promise<void> {
  await endMeetups (client);

  // Every day at midnight
  schedule.scheduleJob (
    '5 0 * * *', 
    () => {
      Log.runWithContext (() => {
        log.info ('Ending any finished meetups');
        endMeetups (client);
      });
    }
  );
}
  
// Check the timestamp for meetups
// and mark any old ones as "done"
export const endMeetups = async (client: Discord.Client) : Promise<void> => {
  const midnight = 
    DateTime.local ().set ({ hour: 0, minute: 0 }).toISO ();

  const meetups = await db.find ({
    'state.type': 'Live',
    timestamp:    { $lt: midnight }
  });

  for (const meetup of meetups) {
    log.debug ('Meetup ended', { id: meetup.id, title: meetup.title });
    
    await db.update ({
      ...meetup,
      state: { type: 'Ended' }
    });

    const channel = await client.channels.fetch (meetup.threadID);
    
    if (channel?.isThread ()) {
      channel.setName (`(Ended) ${M.threadTitle (meetup.title, meetup.timestamp)}`);
    }
  }
}