import * as MongoMemoryServer from '@sjbha/__test__/MongoMemoryServer';
import * as Discord from 'discord.js';
import { DateTime, Settings } from 'luxon';

import * as Meetups from '../db/meetups';
import * as Directory from './Directory';

Settings.defaultZoneName = 'America/Los_Angeles';

const now = DateTime.local (2021, 11, 15, 17, 0, 0, 0);

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
  const directory = {
    embeds:    [] as Discord.MessageEmbed[],
    findTitle: function (title: string) {
      return this.embeds.find (
        embed => embed.description?.includes (title)
      );
    }
  };

  const ignore = () => { /** noop */ };

  const channel = {
    isText:   () => true,
    messages: { fetch: ignore },
    send:     (options: Discord.MessageOptions) => {
      const embeds = (options.embeds || []) as Discord.MessageEmbed[];
      directory.embeds = directory.embeds.concat (embeds);
      return { id: '' };
    }
  }

  const client = { 
    channels: { fetch: () => Promise.resolve (channel) } 
  } as unknown as Discord.Client;

  beforeAll (() => Directory.refresh (client, now));

  it ('gets today live', async () => {
    expect (directory.findTitle ('today/live')).toBeTruthy ();
  });

  it ('gets tomorrow live', async () => {
    expect (directory.findTitle ('tomorrow/live')).toBeTruthy ();
  });

  it ('gets cancelled if it was cancelled today', async () => {
    expect (directory.findTitle ('today/cancelled')).toBeTruthy ();
  });

  it ('doesn\'t get ended meetups', async () => {
    expect (directory.findTitle ('yesterday/ended')).toBeFalsy ();
  });

  it ('doesn\'t get meetups cancelled before today', async () => {
    expect (directory.findTitle ('yesterday/cancelled')).toBeFalsy ();
  });
});