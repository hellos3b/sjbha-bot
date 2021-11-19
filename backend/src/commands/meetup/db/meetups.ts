import { FilterQuery } from 'mongodb';
import { createNanoEvents } from 'nanoevents';
import * as Log from '@sjbha/utils/Log';

import { MongoDb } from '@sjbha/app';

const getCollection = () =>
  MongoDb.getCollection<Schema> ('meetups-labs');

export const events = createNanoEvents<{
  'add': (meetup: Meetup) => void;
  'update': (meetup: Meetup) => void;
}>();

events.on ('add', meetup => {
  Log.event (`Meetup '${meetup.title}' was added'`);
});

events.on ('update', meetup => {
  Log.event (`Meetup '${meetup.title}' was updated'`);
});

export type Schema = {
  __version: 1;
  id: string;

  organizerID: string;
  sourceChannelID: string;
  threadID: string;
  announcementID: string;

  createdAt: string;
  title: string;
  timestamp: string;
  description: string;
  links: { label?: string; url: string; }[];
  category: string;
  location?: { value: string; comments: string; autoLink: boolean; }

  rsvps: string[];
  maybes: string[];

  state: 
    | { type: 'Live' }
    | { type: 'Ended' }
    | { type: 'Cancelled', reason: string, timestamp: string };
}

export type Meetup = Omit<Schema, '__version'>;
export const Meetup = (meetup: Meetup) : Meetup => ({ ...meetup });

const stripVersion = ({ __version, ...schema }: Schema) : Meetup => schema;

const addVersion1 = (meetup: Meetup) : Schema => ({ __version: 1, ...meetup });

export async function insert(meetup: Meetup) : Promise<Meetup> {
  const collection = await getCollection ();
  await collection.insertOne (addVersion1 (meetup));
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
  await collection.replaceOne ({ id: meetup.id }, addVersion1 (meetup));
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