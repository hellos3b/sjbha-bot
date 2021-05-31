import { db } from '@sjbha/app';
import { Interval } from 'luxon';
import { FilterQuery, FindOneOptions, QuerySelector } from 'mongodb';
import { variantModule, TypeNames, VariantOf, match } from 'variant';

const collection = db<Model> ('fit-exp');

export const Exp = variantModule ({
  hr:   (moderate: number, vigorous: number) => ({ moderate, vigorous }),
  time: (exp: number) => ({ exp })
});

export type Exp<T extends TypeNames<typeof Exp> = undefined>= VariantOf<typeof Exp, T>;

export type Workout = {
  __version: 1;
  discord_id: string;
  activity_id: number;
  message_id: string;
  activity_name: string;
  timestamp: string;
  activity_type: string;
  exp: Exp;
}

type Model = Workout | Workout__V0;

export const find = (query: FilterQuery<Workout>, options: FindOneOptions<Workout> = {}) : Promise<Workout[]> =>
  collection ()
    .find (query, options)
    .toArray ()
    .then (a => a.map (migrate));

export const findOne = (query: FilterQuery<Workout>, options: FindOneOptions<Workout> = {}) : Promise<Workout | null> =>
  collection ()
    .findOne (query, options)
    .then (workout => workout ? migrate (workout) : null);
  
export const insert = async (props: Omit<Workout, '__version'>) : Promise<Workout> => {
  const workout : Workout = { __version: 1, ...props };

  await collection ().insertOne (workout);

  return workout;
}

export const update = async (workout: Workout) : Promise<void> => {
  await collection ().replaceOne (
    { activity_id: workout.activity_id },
    workout
  );
}

export const remove = async (workout: Workout) : Promise<void> => {
  await collection ().deleteOne ({ activity_id: workout.activity_id });
}

// Helpers

export const between = (i: Interval) : QuerySelector<Workout['timestamp']> => ({
  $lt: i.end.toUTC ().toISO (),
  $gt: i.start.toUTC ().toISO ()
});

export const expTotal = (exp: Exp) : number => match (exp, {
  hr:   h => h.moderate + h.vigorous,
  time: t => t.exp
});

// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------

const migrate = (model: Model) : Workout => {
  if (!('__version' in model)) {
    const exp = (model.exp_type === 'hr')
      ? Exp.hr (model.exp_gained - model.exp_vigorous, model.exp_vigorous)
      : Exp.time (model.exp_gained);

    return { 
      ...model, 
      __version:  1,
      message_id: '',
      exp
    };
  }

  return model;
}

type Workout__V0 = {
  discord_id: string;
  activity_id: number;
  activity_name: string;
  timestamp: string;
  activity_type: string;
  exp_type: 'hr' | 'time';
  exp_gained: number;
  exp_vigorous: number;
}