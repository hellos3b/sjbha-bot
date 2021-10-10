import { Instance, onClientReady, onMongoDbReady, Reaction$ } from '@sjbha/app';
import { Collection, Message, MessageReaction, User } from 'discord.js';
import * as db from '../db/meetups';
import { Announcement, Reaction } from '../common/Announcement';

export const RsvpEmoji =  '✅';
export const MaybeEmoji = '🤔';

// We'll maintain a cache of meetup IDs that we care about
// so when a message reaction comes in we can quickly deny it.
// We get reactions on every message in the server so it
// would be a waste to do a DB lookup every time
const announcementIds = new Set<string> ();


// Meant to be called when booting up
// fetches all relevant meetups from the DB and makes sure their
// RSVP lists are updated
export async function init() : Promise<void> {
  await Promise.all ([onClientReady, onMongoDbReady]);
  
  const meetups = await db.find ({
    'state.type':        'Live',
    'announcement.type': 'Inline'
  });

  for (const meetup of meetups) {
    await initAnnouncement (meetup);
  }

  // Begin listening to events
  db.events.on ('add', initAnnouncement);
  db.events.on ('update', meetup => {
    const messageId = (meetup.announcement.type === 'Inline')
      ? meetup.announcement.messageId
      : '';

    if (meetup.state.type !== 'Live') {
      announcementIds.delete (messageId);
    }
  });

  Reaction$
    .filter (data => announcementIds.has (data.reaction.message.id))
    .filter (data => !data.user.bot)
    .filter (data => [RsvpEmoji, MaybeEmoji].includes (data.reaction.emoji.name))
    .subscribe (({ type, reaction, user }) => 
      (type === 'add')
        ? onAddReaction (reaction, user)
        : onRemoveReaction (reaction)
    );
}


// Add a message ID to the cache to listen to new reactions
// and clean up any double RSVP's
async function initAnnouncement (meetup: db.Meetup) {
  const announcement = meetup.announcement;

  if (announcement.type === 'Inline') {
    announcementIds.add (announcement.messageId);

    const message = await Instance.fetchMessage (announcement.channelId, announcement.messageId);
    const { yes, maybe } = await fetchRsvps (message);

    // On old messages, the users aren't cached by default
    await Promise.all ([
      yes.users.fetch (), 
      maybe.users.fetch ()
    ]);
    const maybes = maybe.users.cache.filter (u => !u.bot);
    const attending = yes.users.cache.filter (u => !u.bot);

    // If anyone is RSVP'd to both yes & maybe, remove their maybe vote
    for (const [_, user] of attending) {
      if (maybes.has (user.id)) {
        await maybe.users.remove (user.id);
        maybes.delete (user.id);
      }
    }

    // Update the post with the new RSVPs
    const embed = Announcement (meetup, Reactions (attending, maybes));
    await message.edit (embed);
  }
}

// When a user removes a reaction
async function onRemoveReaction (reaction: MessageReaction) {
  const meetup = await db.findOne ({
    'state.type':             'Live',
    'announcement.messageId': reaction.message.id
  });

  if (!meetup) {
    return;
  }

  const { yes, maybe } = await fetchRsvps (reaction.message);

  const embed = Announcement (meetup, Reactions (yes.users.cache, maybe.users.cache));
  await reaction.message.edit (embed);
}


// When a user adds a reaction
async function onAddReaction (reaction: MessageReaction, user: User) {
  const meetup = await db.findOne ({
    'state.type':             'Live',
    'announcement.messageId': reaction.message.id
  });

  if (!meetup) {
    console.log ('no meetup found', reaction.message.id, announcementIds);
    return;
  }

  const { yes, maybe } = await fetchRsvps (reaction.message);

  // If they click on an emoji and already have one selected
  // we'll remove the old one
  if (reaction.emoji.name === RsvpEmoji && maybe.users.cache.has (user.id)) {
    await maybe.users.remove (user.id);
    maybe.users.cache.delete (user.id);
  }
  else if (reaction.emoji.name === MaybeEmoji && yes.users.cache.has (user.id)) {
    await yes.users.remove (user.id);
    yes.users.cache.delete (user.id);
  }

  const embed = Announcement (meetup, Reactions (yes.users.cache, maybe.users.cache));
  await reaction.message.edit (embed);
}


// Fetches the current RSVP list from the message
// Digs through the cache first, if missing in the cache
// then will initialize the reaction itself
async function fetchRsvps (message: Message) {
  const yes = message.reactions.cache.get (RsvpEmoji)
    ?? await message.react (RsvpEmoji);

  const maybe = message.reactions.cache.get (MaybeEmoji)
    ?? await message.react (MaybeEmoji);

  return { yes, maybe };
}


/**
 * Fetch the RSVPs on the list as Reactions that can be passed in
 * to the Announcement embed
 * @param message The reference to the announcement post
 * @returns 
 */
export async function fetchReactions (message: Message) : Promise<Reaction[]> {
  const { yes, maybe } = await fetchRsvps (message);
  return Reactions (yes.users.cache, maybe.users.cache);
}


// Convert user collections to reactions for the embed
const Reactions = (attending: Collection<string, User>, maybes: Collection<string, User>) : Reaction[] => [
  { emoji: RsvpEmoji, name: 'Attending', users: attending.filter (u => !u.bot).map (u => u.username) },
  { emoji: MaybeEmoji, name: 'Maybe', users: maybes.filter (u => !u.bot).map (u => u.username) }
];