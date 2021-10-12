import { onMongoDbReady } from '@sjbha/app';
import { queued } from '@sjbha/utils/queue';
import { DateTime } from 'luxon';

import * as db from '../db/meetups';
import schedule from 'node-schedule';

// Start the scheduler
export async function init() : Promise<void> {
  await onMongoDbReady; 
  await endMeetups ();

  // Check every hour
  schedule.scheduleJob ('0 * * * *', () => runEndMeetups ());
  db.events.on ('edited', runEndMeetups);
}

const runEndMeetups = queued (endMeetups);

// Check the timestamp for meetups
// and mark any old ones as "done"
async function endMeetups () {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  for (const meetup of meetups) {
    const timestamp = DateTime.fromISO (meetup.timestamp);
    const diff = DateTime.local ()
      .diff (timestamp, 'hours')
      .toObject ();

    // We mark 4 hour old meetups as ended
    if (diff.hours && diff.hours >= 4) {
      await db.update ({
        ...meetup,
        state: { type: 'Ended' }
      });
    }
  }
}