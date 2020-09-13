import mongodb from '@services/mongodb';
import type {Collection} from 'mongodb';

const COLLECTION_NAME = 'fit-exp';

export interface ExpSchema {
  activityId: string;
  discordId: string;
  week: string;
  moderate: number;
  vigorous: number;
}

export default function getCollection() {
  return mongodb.getCollection(COLLECTION_NAME) as Collection<ExpSchema>;
}