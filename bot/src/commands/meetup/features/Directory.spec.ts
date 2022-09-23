import * as MongoMemoryServer from '../../../__test__/MongoMemoryServer';
import * as Discord from 'discord.js';
import { DateTime, Settings } from 'luxon';

import * as Meetups from '../db/meetups';
import * as Directory from './Directory';

const now = DateTime.local (2021, 11, 15, 17, 0, 0, 0);

Settings.now = () => now.toMillis ();
Settings.defaultZoneName = 'America/Los_Angeles';

const meetupDefaults = Meetups.Meetup ({
  id:              Math.random ().toString (),
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

// Setup the DB
beforeAll (async () => {
  await MongoMemoryServer.setup ();

  // Insert the meetups into the DB
  return Promise.all ([
    Meetups.insert ({
      ...meetupDefaults,
      title:     'today/live',
      timestamp: now.toISO ()
    }),

    Meetups.insert ({
      ...meetupDefaults,
      title:     'tomorrow/live',
      timestamp: now.plus ({ days: 3 }).toISO ()
    }),

    Meetups.insert ({
      ...meetupDefaults,
      title:     'today/cancelled',
      timestamp: now.toISO (),
      state:     { 
        type:      'Cancelled', 
        reason:    '', 
        timestamp: now.minus ({ hours: 5 }).toISO () 
      }
    }),

    Meetups.insert ({
      ...meetupDefaults,
      title:     'yesterday/ended',
      timestamp: now.minus ({ days: 1 }).toISO (),
      state:     { type: 'Ended' }
    }),

    Meetups.insert ({
      ...meetupDefaults,
      title:     'yesterday/cancelled',
      timestamp: now.plus ({ days: 10 }).toISO (),
      state:     { 
        type:      'Cancelled', 
        reason:    '',
        timestamp: now.minus ({ days: 1 }).toISO ()  
      }
    })
  ]);
});

afterAll (() => MongoMemoryServer.teardown ());

describe ('meetup/Directory', () => {
  const directoryChannel = {
    _embeds_: [] as Discord.EmbedBuilder[],

    send: function (options: Discord.MessageOptions) {
      const embeds = (options.embeds || []) as Discord.EmbedBuilder[];
      this._embeds_ = this._embeds_.concat (embeds);
      return { id: 'any' };
    },

    isText:   () => true,
    messages: { fetch: () => { /** noop */ } },
  }

  const client = { 
    channels: { fetch: () => Promise.resolve (directoryChannel) } 
  } as unknown as Discord.Client;

  // Refresh the Directory
  beforeAll (() => Directory.refresh (client));

  it ('shows live meetups from today', () => {
    const post = directoryChannel._embeds_
      .find (e => e.toJSON ().description?.includes ('today/live'));
    expect (post).toBeTruthy ();
  });

  it ('shoes upcoming meetups', () => {
    const post = directoryChannel._embeds_
      .find (e => e.toJSON ().description?.includes ('tomorrow/live'));
    expect (post).toBeTruthy ();
  });
  
  it ('doesnt show meetups that have ended', () => {
    const post = directoryChannel._embeds_
      .find (e => e.toJSON ().description?.includes ('yesterday/ended'));
    expect (post).toBeFalsy ();
  });

  it ('shows cancelled meetups if it was cancelled today', async () => {
    const post = directoryChannel._embeds_
      .find (e => e.toJSON ().description?.includes ('today/cancelled'));
    expect (post).toBeTruthy ();
  });

  it ('doesnt show meetups that were cancelled before today', () => {
    const post = directoryChannel._embeds_
      .find (e => e.toJSON ().description?.includes ('yesterday/cancelled'));
    expect (post).toBeFalsy ();
  });
});