import * as MongoMemoryServer from '@sjbha/__test__/MongoMemoryServer';
import { DateTime, Settings } from 'luxon';
import * as Discord from 'discord.js';

import * as Meetups from '../db/meetups';
import * as EndMeetup from './EndMeetup';

Settings.defaultZoneName = 'America/Los_Angeles';

const now = DateTime.local (2021, 11, 15, 17, 0, 0, 0);

const meetupDefaults = Meetups.Meetup ({
  id:              'default',
  organizerID:     '',
  sourceChannelID: '',
  threadID:        '',
  announcementID:  '',
  createdAt:       '',
  title:           '',
  timestamp:       now.toISO (),
  description:     '',
  category:        '',
  links:           [],
  rsvps:           [],
  maybes:          [],
  location:        undefined,
  state:           { type: 'Live' }
});

// Propogate a fake DB
beforeAll (async () => {
  await MongoMemoryServer.setup ();

  // Insert the meetups into the DB
  await Promise.all ([
    Meetups.insert ({
      ...meetupDefaults,
      id:        'today',
      timestamp: now.plus ({ hours: 2 }).toISO ()
    }),

    Meetups.insert ({
      ...meetupDefaults,
      id:        'earlier',
      timestamp: now.minus ({ hours: 2 }).toISO ()
    }),

    Meetups.insert ({
      ...meetupDefaults,
      id:        'yesterday',
      timestamp: now.minus ({ days: 1 }).toISO ()
    })
  ]);
});


afterAll (() => MongoMemoryServer.teardown ());

describe ('meetup/EndMeetup', () => {
  // Setup the DB
  beforeAll (async () => {
    const mockClient = {
      channels: { fetch: () => Promise.resolve (null) }
    } as unknown as Discord.Client;

    // Run an end job on all meetups
    await EndMeetup.endMeetups (mockClient, now);
  });

  it ('doesn\'t end future meetups', async () => {
    const meetup = await Meetups.findOne ({ id: 'today' });
    expect (meetup?.state.type).toEqual ('Live');
  });

  it ('doesn\'t end recent meetups', async () => {
    const meetup = await Meetups.findOne ({ id: 'earlier' });
    expect (meetup?.state.type).toEqual ('Live');
  });

  it ('ends meetups before today', async () => {
    const meetup = await Meetups.findOne ({ id: 'yesterday' });
    expect (meetup?.state.type).toEqual ('Ended');
  });
})