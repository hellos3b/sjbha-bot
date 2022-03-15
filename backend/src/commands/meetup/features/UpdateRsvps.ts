import * as Discord from 'discord.js';
import * as Log from '@sjbha/utils/Log';
import * as db from '../db/meetups';

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
  Log.started (`Listening to RSVPs for '${meetup.title}'`);

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

    Log.event (`${i.user.username} Clicked on ${i.customId} for '${state.title}'`);

    if (i.customId === 'rsvp' && !state.rsvps.includes (i.user.id)) {
      await db.update ({
        ...meetup,
        rsvps:  state.rsvps.concat (i.user.id),
        maybes: state.maybes.filter (id => id !== i.user.id)
      });

      if (i.channel && i.channel.isThread ())
        i.channel.members.add (i.user.id);

      i.deferUpdate ();
    }
    else if (i.customId === 'maybe' && !state.maybes.includes (i.user.id)) {
      await db.update ({
        ...meetup,
        rsvps:  state.rsvps.filter (id => id !== i.user.id),
        maybes: state.maybes.concat (i.user.id)
      });
      i.deferUpdate ();
    }
    else if (i.customId === 'remove') {
      await db.update ({
        ...meetup,
        rsvps:  state.rsvps.filter (id => id !== i.user.id),
        maybes: state.maybes.filter (id => id !== i.user.id)
      });
      i.deferUpdate ();
    }
    else {
      i.deferUpdate ();
    }
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
      const error = (e instanceof Error) ? e.message : 'Unknown Reason';
      console.error (`Could not setup RSVP listeners for ${meetup.title} (${meetup.id}): ${error}`)
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