import { Instance } from '@sjbha/app';
import * as db from '../db/meetups';

type Unbind = () => void;


// We'll maintain a cache of meetup IDs that we care about
// so when a message reaction comes in we can quickly deny it.
// We get reactions on every message in the server so it
// would be a waste to do a DB lookup every time
const listeners = new Map<string, Unbind> ();


// Meant to be called when booting up
// fetches all relevant meetups from the DB and makes sure their
// RSVP lists are updated
export async function init() : Promise<void> {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  for (const meetup of meetups) {
    try {
      const unbind = await initListeners (meetup);
      listeners.set (meetup.id, unbind);
    }
    catch (e) {
      const error = (e instanceof Error) ? e.message : 'Unknown Reason';
      console.error (`Could not setup RSVP listeners for ${meetup.title} (${meetup.id}): ${error}`)
    }
  }

  db.events.on ('add', initListeners);
  db.events.on ('update', prune);
}


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
async function initListeners (meetup: db.Meetup) : Promise<Unbind> {
  console.log (`Listening to RSVPs for '${meetup.title}'`);

  const message = await Instance.fetchMessage (meetup.threadID, meetup.announcementID);
  const collector = message.channel.createMessageComponentCollector ();

  collector.on ('collect', async i => {
    // Get the latest model
    const state = await db.findOne ({ id: meetup.id });

    if (!state)
      return;

    console.log (`${i.user.username} Clicked on ${i.customId} for '${state.title}'`);

    if (i.customId === 'rsvp' && !state.rsvps.includes (i.user.id)) {
      await db.update ({
        ...meetup,
        rsvps:  state.rsvps.concat (i.user.id),
        maybes: state.maybes.filter (id => id !== i.user.id)
      });

      i.channel && i.channel.send (`✅ <@${i.user.id}> is attending!`);
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