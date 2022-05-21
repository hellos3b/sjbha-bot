import { MongoDb } from '@sjbha/app';
import { Collection } from 'mongodb';

export type result =
  | 'win'
  | 'tie'
  | 'loss'

export type streak = {
  _v: 1;
  userId: string;
  bestStreak: number;
  currentStreak: number;
  history: result[];
  cooldown?: string;
}

const make = (userId: string) : streak => ({ _v: 1, userId, bestStreak: 0, currentStreak: 0, history: [] });

const getCollection = () : Promise<Collection<schema>> => 
  MongoDb.getCollection<schema> ('rps-streak');

export const findOrMake = async (userId: string) : Promise<streak> => {
  const collection = await getCollection ();
  const streak = await collection.findOne ({ userId });

  return (!streak)
    ? make (userId)
    : migrate (streak);
}

export async function fetchAll () : Promise<streak[]> {
  const collection = await getCollection ();
  const streaks = await collection.find ().toArray ();
  return streaks.map (migrate);
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

// Old versions in DB

function migrate(streak: schema) : streak {
  if (!('_v' in streak)) {
    return { ...streak, _v: 1, history: [] };
  }

  return streak;
} 

type schema = 
  | streak_v0
  | streak;

type streak_v0 = {
  userId: string;
  bestStreak: number;
  currentStreak: number;
  cooldown?: string;
}