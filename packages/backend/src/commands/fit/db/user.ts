import { db } from '@sjbha/app';
import { FilterQuery } from 'mongodb';
import { nanoid } from 'nanoid';

const collection = db<Model> ('fit-users');

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
  gender:       string;
  maxHR?:       number;
  xp:           number;
  fitScore:     number;
}

export type User = Authorized | MidAuthorization;

type Model = User | User__V0;

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

export const findOne = (q: FilterQuery<User>) : Promise<User | null> =>
  collection ()
    .findOne (q)
    .then (user => user ? migrate (user) : null);

export const update = async (user: User) : Promise<User> => {
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

const migrate = (model: Model) : User => {
  if (!('__version' in model)) {
    return migrations.v0 (model);
  }

  return model;
}

const migrations = {
  v0: (model: User__V0) : Authorized => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = model;
  
    return {
      ...user,
      __version: 1,
      authToken: nanoid ()
    };
  }
}

type User__V0 = {
  discordId:    string;
  password:     string;
  stravaId:     number;
  refreshToken: string;
  gender:       string;
  maxHR:        number;
  xp:           number;
  fitScore:     number;
}