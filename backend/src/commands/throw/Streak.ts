import { MongoDb } from '@sjbha/app';
import { Collection } from 'mongodb';

export type streak = {
  userId: string;
  bestStreak: number;
  currentStreak: number;
  cooldown?: string;
}

const make = (userId: string) => ({ userId, bestStreak: 0, currentStreak: 0 });

const getCollection = () : Promise<Collection<streak>> => 
  MongoDb.getCollection<streak> ('rps-streak');

export const findOrMake = async (userId: string) : Promise<streak> => {
  const collection = await getCollection ();
  const streak = await collection.findOne ({ userId });

  return streak ?? make (userId);
}

export const update = async (streak: streak) : Promise<streak> => {
  const collection = await getCollection ();

  await collection.replaceOne (
    { userId: streak.userId }, 
    streak, 
    { upsert: true }
  );

  return streak;
}