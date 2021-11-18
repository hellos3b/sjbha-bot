import { db } from '@sjbha/app';

export interface Subscription {
  name: string;
  id  : string;
}

export const Subscriptions = db<Subscription> ('subscriptions');