import { FilterQuery } from "mongodb";
import { nanoid } from "nanoid";
import { getCollection } from "../../deprecating/legacy_instance";
import type { emojiSet } from "./EmojiSet";
import * as UserMigration from "./UserMigration";

// When a user first tries to setup their account,
// all we have is a discordId and an auto generated auth token.
// The auth token functions like a password,
// used to validate an OAuth flow
export type midAuthorization = {
  __version: 1;
  discordId: string;
  authToken: string;
}

export type authorized = {
  __version:    1;
  discordId:    string;
  authToken:    string;
  stravaId:     number;
  refreshToken: string;
  emojis:       emojiSet;
  maxHR?:       number;
  maxRecordedHR?: number;
  xp:           number;
  fitScore:     number;
}

export type user = 
  | authorized 
  | midAuthorization;

const getUserCollection = () =>
   getCollection<user | UserMigration.legacy> ("fit-users");

// -- SELECTORS

export const isAuthorized = (user: user | null) : user is authorized => 
   !!user && "refreshToken" in user;

// Updates the authToken if a user already exists with that ID
export const find = async (q: FilterQuery<user> = {}) : Promise<user[]> =>
   (await getUserCollection ())
      .find (q)
      .toArray ()
      .then (users => users.map (UserMigration.migrate));

export const findOne = async (q: FilterQuery<user>) : Promise<user | null> =>
   (await getUserCollection ())
      .findOne (q)
      .then (user => user ? UserMigration.migrate (user) : null);

// -- UPDATES

export const update = async <T extends user>(user: T) : Promise<T> =>
   (await getUserCollection ())
      .replaceOne ({ discordId: user.discordId }, user)
      .then (_ => user);

export const init = async (discordId: string) : Promise<user> => {
   const collection = await getUserCollection ();
   const authToken = nanoid ();

   const user: user = await findOne ({ discordId })
      .then (user => 
         (!user)
            ? ({ __version: 1, discordId, authToken })
            : ({ ...user, authToken })
      );

   await collection.replaceOne ({ discordId: user.discordId }, user, { upsert: true });

   return user;
};
    