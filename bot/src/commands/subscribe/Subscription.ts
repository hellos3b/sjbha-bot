import { MongoDb } from '@sjbha/app';
import { Collection } from 'mongodb';

export type subscription = {
  name: string;
  id  : string;
}

export const collection = () : Promise<Collection<subscription>> => 
  MongoDb.getCollection<subscription> ('subscriptions');