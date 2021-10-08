import { db } from '@sjbha/app';
import { FilterQuery } from 'mongodb';
import { nanoid } from 'nanoid';
import type { EmojiSet } from '../common/activity-emoji';

const collection = db<LegacySchema> ('fit-users');

export type MidAuthorization = {
  __version: 1;
  discordId: string;
  authToken: string;
}

export type Authorized = {
  __version:    1;
  discordId:    string;
  authToken:    string;
  stravaId:     number;
  refreshToken: string;
  emojis:       EmojiSet;
  maxHR?:       number;
  maxRecordedHR?: number;
  xp:           number;
  fitScore:     number;
}

export type User = 
  | Authorized 
  | MidAuthorization;

type LegacySchema = User | Schema__V0;

/**
 * Create a new User and insert it into the DB.
 * Will update authToken if a user already exists with that ID
 * 
 * @returns Created or updated user
 */
export const init = async (discordId: string) : Promise<User> => {
  const authToken = nanoid ();

  const user: User = await findOne ({ discordId })
    .then (user => 
      (!user)
        ? ({ __version: 1, discordId, authToken })
        : ({ ...user, authToken })
      );

  await collection ().replaceOne ({ discordId: user.discordId }, user, { upsert: true });

  return user;
}

export const find = (q: FilterQuery<User> = {}) : Promise<User[]> =>
  collection ()
    .find (q)
    .toArray ()
    .then (users => users.map (migrate));

export const findOne = (q: FilterQuery<User>) : Promise<User | null> =>
  collection ()
    .findOne (q)
    .then (user => user ? migrate (user) : null);

export const update = async <T extends User>(user: T) : Promise<T> => {
  await collection ().replaceOne ({ discordId: user.discordId }, user);

  return user;
}

// Helpers

export const isAuthorized = (user: User | null) : user is Authorized => 
  !!user && 'refreshToken' in user;

// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------

const migrate = (model: LegacySchema) : User => {
  if (!('__version' in model)) {
    return migrations.v0 (model);
  }

  return model;
}

const migrations = {
  v0: (model: Schema__V0) : Authorized => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = model;
  
    return {
      ...user,
      __version: 1,
      authToken: nanoid (),
      emojis:    model.gender === 'M'
        ? 'people-default'
        : 'people-female',
    };
  }
}

type Schema__V0 = {
  discordId:    string;
  password:     string;
  stravaId:     number;
  refreshToken: string;
  gender:       string;
  maxHR:        number;
  xp:           number;
  fitScore:     number;
}