import { db } from '@sjbha/app';
import { Interval } from 'luxon';
import { FilterQuery } from 'mongodb';
import { variantModule, TypeNames, VariantOf } from 'variant';

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

export const find = (query: FilterQuery<Workout>, interval: Interval) : Promise<Workout[]> =>
  collection ()
    .find ({
      ...query,
      timestamp: {
        $lt: interval.end.toUTC ().toISO (),
        $gt: interval.start.toUTC ().toISO (),
      }
    })
    .toArray ()
    .then (a => a.map (migrate));

export const findByActivity = async (activityId: number) : Promise<Workout | null> => 
  collection ()
    .findOne ({ activity_id: activityId })
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