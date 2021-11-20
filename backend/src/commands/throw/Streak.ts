import { MongoDb } from '@sjbha/app';
import { Collection } from 'mongodb';

export type Streak = {
  userId: string;
  bestStreak: number;
  currentStreak: number;
  cooldown?: string;
}

const Streak = (userId: string) => ({ userId, bestStreak: 0, currentStreak: 0 });

const getCollection = () : Promise<Collection<Streak>> => 
  MongoDb.getCollection<Streak> ('rps-streak');

export const findOrCreate = async (userId: string) : Promise<Streak> => {
  const streaks = 
    await getCollection ();

  const streak =
    await streaks.findOne ({ userId });

  return streak ?? Streak (userId);
}

export const update = async (streak: Streak) : Promise<Streak> => {
  const streaks = 
    await getCollection ();

  await streaks.replaceOne (
    { userId: streak.userId }, 
    streak, 
    { upsert: true }
  );

  return streak;
}