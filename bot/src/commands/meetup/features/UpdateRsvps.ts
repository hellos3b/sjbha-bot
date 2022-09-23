import * as Discord from 'discord.js';
import { Log } from '../../../app';
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
function prune(meetup: db.Meetup) {
  if (meetup.state.type !== 'Live') {
    const unbind = listeners.get (meetup.id);
    unbind && unbind ();
    listeners.delete (meetup.id);
  }
}

enum Rsvp {
  Attending = 'Attending',
  Interested = 'Interested',
  None = 'None'
}

// Initializes the collectors that will listen 
// to the clicks on the buttons of the meetup
const createRsvpListener = async (client: Discord.Client, meetup: db.Meetup): Promise<Unbind> => {
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
    const meetupState = await db.findOne ({ id: meetup.id });

    if (!meetupState)
      return;

    Log.runWithContext (async () => {
      log.info ('User is updating their RSVP', { userId: i.user.id, username: i.user.username, thread: meetupState.title, button: i.customId });
      const prevState =
        meetupState.rsvps.includes (i.user.id) ? Rsvp.Attending
          : meetupState.maybes.includes (i.user.id) ? Rsvp.Interested
            : Rsvp.None;

      const nextState =
        (i.customId === 'rsvp') ? Rsvp.Attending
          : (i.customId === 'maybe') ? Rsvp.Interested
            : Rsvp.None;

      log.debug ('Rsvp has been updated', { prevState, nextState });

      const rsvps = meetupState.rsvps
        .filter (id => id !== i.user.id)
        .concat ((nextState === Rsvp.Attending) ? [i.user.id] : []);

      const maybes = meetupState.maybes
        .filter (id => id !== i.user.id)
        .concat ((nextState === Rsvp.Interested) ? [i.user.id] : []);

      await db.update ({ ...meetupState, rsvps, maybes });
      i.deferUpdate ();

      // Announce the change
      const content = (function () {
        if (nextState === Rsvp.Attending && prevState !== Rsvp.Attending)
          return `✅ <@${i.user.id}> is attending!`;
        if (nextState === Rsvp.Interested && prevState === Rsvp.None)
          return `⭐ <@${i.user.id}> is interested`;
        if (prevState === Rsvp.Attending && nextState !== Rsvp.Attending)
          return `🚫 <@${i.user.id}> is no longer attending`;
        else
          return '';
      }) ();

      if (content && i.channel)
        i.channel.send ({ content });
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
export const startWatching = async (client: Discord.Client): Promise<void> => {
  const meetups = await db.find ({
    'state.type': 'Live'
  });

  await Promise.all (meetups.map (initRsvpListeners (client)));

  db.events.on ('add', initRsvpListeners (client));
  db.events.on ('update', prune);
}