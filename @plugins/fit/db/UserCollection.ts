import mongodb from '@services/mongodb';
import type {Collection} from 'mongodb';

const COLLECTION_NAME = 'fit-users';

export interface UserSchema {
  discordId: string;

  stravaId: string;
  password: string;
  refreshToken: string;

  gender: string;
  xp: number;
  maxHR: number;
  fitScore: number;
}

export default function getCollection() {
  return mongodb.getCollection(COLLECTION_NAME) as Collection<UserSchema>;
}