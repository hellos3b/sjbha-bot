import * as Discord from 'discord.js';
import { Log } from '@sjbha/app';
import * as db from '../db/meetups';

const log = Log.make ('fit:update-rsvps');

type Unbind = () => void;


// We'll maintain a cache of meetup IDs that we care about
// so when a message reaction comes in we can quickly deny it.
// We get reactions on every message in the server so it
// would be a waste to do a DB lookup every time
const listeners = new Map<string, Unbind> ();

// Checks if the meetup is still considered live
// otherwise stops listening to reactions
function prune (meetup: db.Meetup) {
  if (meetup.state.type !== 'Live') {
    const unbind = listeners.get (meetup.id);
    unbind && unbind ();
    listeners.delete (meetup.id);
  }
}

// Initializes the collectors that will listen 
// to the clicks on the buttons of the meetup
const createRsvpListener = async (client: Discord.Client, meetup: db.Meetup) : Promise<Unbind> => {
  const channel = await client.channels.fetch (meetup.threadID);

  if (!channel?.isThread ()) {
    throw new Error (`Meetups thread does not exist or is not a thread (id: ${meetup.threadID})`);
  }

  const message = await channel.messages.fetch (meetup.announcementID);

  if (!message) {
    throw new Error (`Could not find Announcement message (id: ${meetup.announcementID})`)
  }

  const collector = message.channel.createMessageComponentCollector ();

  collector.on ('collect', async i => {
    // Get the latest model
    const state = await db.findOne ({ id: meetup.id });

    if (!state)
      return;

    Log.runWithContext (async () => {
      log.info ('User is updating their RSVP', { userId: i.user.id, username: i.user.username, thread: state.title, button: i.customId });

      if (i.customId === 'rsvp' && !state.rsvps.includes (i.user.id)) {
        await db.update ({
          ...meetup,
          rsvps:  state.rsvps.concat (i.user.id),
          maybes: state.maybes.filter (id => id !== i.user.id)
        });

        if (i.channel && i.channel.isThread ())
          i.channel.members.add (i.user.id);

        i.deferUpdate ();
        log.debug ('Added user to RSVP');
      }
      else if (i.customId === 'maybe' && !state.maybes.includes (i.user.id)) {
        await db.update ({
          ...meetup,
          rsvps:  state.rsvps.filter (id => id !== i.user.id),
          maybes: state.maybes.concat (i.user.id)
        });
        i.deferUpdate ();
        log.debug ('Added user to Maybes');
      }
      else if (i.customId === 'remove') {
        await db.update ({
          ...meetup,
          rsvps:  state.rsvps.filter (id => id !== i.user.id),
          maybes: state.maybes.filter (id => id !== i.user.id)
        });
        i.deferUpdate ();
        log.debug ('Removed users RSVP');
      }
      else {
        log.debug ('Unrecognized action');
        i.deferUpdate ();
      }
    });
  });

  return () => { collector.stop (); }
}

const initRsvpListeners = (client: Discord.Client) => 
  async (meetup: db.Meetup) => {
    try {
      const unbind = await createRsvpListener (client, meetup);
      listeners.set (meetup.id, unbind);
    }
    catch (e) {
      log.error ('Failed to initialise RSVP listeners', e);
    } 
  }

// Meant to be called when booting up
// fetches all relevant meetups from the DB and makes sure their
// RSVP lists are updated
export const startWatching = async (client: Discord.Client) : Promise<void> => {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  await Promise.all (meetups.map (initRsvpListeners (client)));

  db.events.on ('add', initRsvpListeners (client));
  db.events.on ('update', prune);
}