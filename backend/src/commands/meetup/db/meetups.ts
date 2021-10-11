import { FilterQuery } from 'mongodb';
import { EventEmitter } from 'tsee';

import { db } from '@sjbha/app';

const collection = db<AllSchemas> ('meetups-labs');

export const events = new EventEmitter<{
  'add': (meetup: Meetup) => void;
  'update': (meetup: Meetup) => void;
  // If the DB was edited manually, hit the $meetup refresh command
  'edited': () => void;
}>();

export type Schema = {
  __version: 1;
  id: string;
  organizerID: string;
  sourceChannelID: string;

  /** threadID will be nullable until we get rid of all legacy meetups */
  threadID?: string;
  createdAt: string;
  title: string;
  timestamp: string;
  description: string;
  links: { label?: string; url: string; }[];
  location: 
    | { type: 'None' }
    | { type: 'Voice' }
    | { type: 'Address'; value: string; comments: string; }
    | { type: 'Private'; value: string; comments: string; };
  state: 
    | { type: 'Live' }
    | { type: 'Ended' }
    | { type: 'Cancelled', reason: string, timestamp: string };
  announcement: 
    | { type: 'Pending'; channelId: string; }
    | { type: 'Inline'; channelId: string; messageId: string; }
    | { type: 'Announcement'; announcementId: string; rsvpId: string; }
}

export type Meetup = Omit<Schema, '__version'>;
export const Meetup = (meetup: Meetup) : Meetup => ({ ...meetup });

const schemaToMeetup = ({ __version, ...schema }: Schema) : Meetup => schema;

const meetupToSchema = (meetup: Meetup) : Schema => ({ __version: 1, ...meetup });

export async function insert(meetup: Meetup) : Promise<Meetup> {
  await collection ().insertOne (meetupToSchema (meetup));
  events.emit ('add', meetup);

  return meetup;
}

export async function update(meetup: Meetup) : Promise<Meetup> {
  await collection ().replaceOne ({ id: meetup.id }, meetupToSchema (meetup));
  events.emit ('update', meetup);
  
  return meetup;
}

export const find = (q: FilterQuery<Schema> = {}) : Promise<Meetup[]> =>
  collection ()
    .find (q, { projection: { _id: 0 } })
    .toArray ()
    .then (meetups => meetups.map (migrate))
    .then (meetups => meetups.map (schemaToMeetup));

export const findOne = async (q: FilterQuery<Schema> = {}) : Promise<Meetup | null> => {
  const result = await collection ().findOne (q, { projection: { _id: 0 } });

  if (!result)
    return null;

  return schemaToMeetup (migrate (result));
}


// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------

type AllSchemas = 
  | Schema 
  | Schema__V0;

const migrate = (model: AllSchemas) : Schema => {
  if (!('__version' in model)) {
    return migrate ({
      __version:       1,
      id:              model.id,
      title:           model.options.name,
      description:     model.options.description,
      organizerID:     model.userID,
      timestamp:       model.timestamp,
      sourceChannelID: model.sourceChannelID,
      createdAt:       '',
      
      location: (model.options.location)
        ? { type: 'Address', value: model.options.location, comments: '' }
        : { type: 'None' },
        
      links: (model.options.url)
        ? [{ url: model.options.url }]
        : [],
  
      state: { type: 'Live' },
      
      announcement: {
        type:           'Announcement',
        announcementId: model.info_id,
        rsvpId:         model.rsvp_id
      }
    });
  }

  return model;
}

type Schema__V0 = {
  id: string;
  date: string;
  timestamp: string;
  info: string;
  userID: string;
  username: string;
  sourceChannelID: string;
  state: string;
  info_id: string;
  rsvp_id: string;
  options: {
    date: string;
    name: string;
    description: string;
    location: string;
    url: string;
    type: string;
  }
};