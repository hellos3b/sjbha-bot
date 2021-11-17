import { MongoDb } from '@sjbha/app';
import { Collection } from 'mongodb';

export interface Subscription {
  name: string;
  id  : string;
}

export const Subscriptions = () : Promise<Collection<Subscription>> => 
  MongoDb.getCollection<Subscription> ('subscriptions');