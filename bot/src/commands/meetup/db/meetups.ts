import { FilterQuery } from 'mongodb';
import { createNanoEvents } from 'nanoevents';
import { MongoDb, Log } from '../../../app';

const log = Log.make ('fit:meetups');

const getCollection = () =>
  MongoDb.getCollection<Schema> ('meetups-labs');

export const events = createNanoEvents<{
  'add': (meetup: Meetup) => void;
  'update': (meetup: Meetup) => void;
}>();

events.on ('add', meetup => {
  log.debug ('Inserting meetup', { id: meetup.id, title: meetup.title });
});

events.on ('update', meetup => {
  log.debug ('Meetup was updated', { id: meetup.id, title: meetup.title });
});

export type Schema = {
  __version: 1;

  /** Unique ID for this model */
  id: string;

  /** Who created the meetup. Can be transfered */
  organizerID: string;

  /** The original channel the meetup was created in */
  sourceChannelID: string;

  /** The thread that was opened for this meetup */
  threadID: string;

  /** The embed that shows the meetup details and RSVP list */
  announcementID: string;

  /** ISO string of when the meetup was originally created */
  createdAt: string;

  /** Short and sweet */
  title: string;

  /** ISO String of when the meetup starts */
  timestamp: string;

  /** Details describing the meetup */
  description: string;

  /** Optional links for additional data, event pages, business website */
  links: { label?: string; url: string; }[];

  /** Decorative category */
  category: string;

  /** Where the meetup takes place. `autoLink=true` makes it show up as a google maps link */
  location?: { value: string; comments: string; autoLink: boolean; }

  /** List of IDs of users who have marked "Yes" */
  rsvps: string[];

  /** List of IDs of users who have marked "Maybe" */
  maybes: string[];

  /** Meetup lifecycle */
  state: 
    | { type: 'Live' }
    | { type: 'Ended' }
    | { type: 'Cancelled', reason: string, timestamp: string };
}

// __version is used internally for in case the model changes
export type Meetup = Omit<Schema, '__version'>;
export const Meetup = (meetup: Meetup) : Meetup => ({ ...meetup });

const stripVersion = ({ __version, ...schema }: Schema) : Meetup => schema;

const addCurentVersion = (meetup: Meetup) : Schema => ({ __version: 1, ...meetup });

export async function insert(meetup: Meetup) : Promise<Meetup> {
  const collection = await getCollection ();
  await collection.insertOne (addCurentVersion (meetup));
  events.emit ('add', meetup);

  return meetup;
}

/**
 * 
 * @param meetup 
 * @param silent Whether or not to emit the update event
 */
export async function update(meetup: Meetup, silent = false) : Promise<Meetup> {
  const collection = await getCollection ();
  await collection.replaceOne ({ id: meetup.id }, addCurentVersion (meetup));
  !silent && events.emit ('update', meetup);
  
  return meetup;
}

export const find = async (q: FilterQuery<Schema> = {}) : Promise<Meetup[]> => {
  const collection = await getCollection ();
  return collection
    .find (q, { projection: { _id: 0 } })
    .toArray ()
    .then (meetups => meetups.map (stripVersion));
}

export const findOne = async (q: FilterQuery<Schema> = {}) : Promise<Meetup | null> => {
  const collection = await getCollection ();
  const result = await collection.findOne (q, { projection: { _id: 0 } });

  if (!result)
    return null;

  return stripVersion (result);
}