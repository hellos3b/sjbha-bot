import { DateTime } from 'luxon';
import schedule from 'node-schedule';

import { Instance, onMongoDbReady } from '@sjbha/app';
import { queued } from '@sjbha/utils/queue';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';

// Start the scheduler
export async function init() : Promise<void> {
  await onMongoDbReady; 
  await endMeetups ();

  // Check every hour
  schedule.scheduleJob ('0 * * * *', () => runEndMeetups ());
}

const runEndMeetups = queued (endMeetups);

// Check the timestamp for meetups
// and mark any old ones as "done"
async function endMeetups () {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  for (const meetup of meetups) {
    const meetupDay = DateTime
      .fromISO (meetup.timestamp)
      .set ({ hour: 0, minute: 0, second: 0 });

    const diff = DateTime.local ()
      .set ({ hour: 0, minute: 0, second: 0 })
      .diff (meetupDay, 'days')
      .toObject ();

    if (diff.days && diff.days > 0) {
      await db.update ({
        ...meetup,
        state: { type: 'Ended' }
      });

      const thread = await Instance.fetchChannel (meetup.threadID);
      if (thread.isThread ()) {
        thread.setName (`(Ended) ${M.threadTitle (meetup.title, meetup.timestamp)}`);
      }
    }
  }
}