/* eslint-disable max-len */
import { MongoDb } from '@sjbha/app';
import { DateTime, Interval } from 'luxon';
import { FilterQuery, FindOneOptions } from 'mongodb';
import { variantModule, TypeNames, VariantOf, match } from 'variant';
import { activityEmoji, EmojiSet } from '../common/activity-emoji';
import { Activity } from '../common/StravaClient';
import * as User from './user';

const getCollection = () =>
  MongoDb.getCollection<Model> ('fit-exp');

export type Schema = {
  readonly __version: 1;
  readonly discord_id: string;
  readonly activity_id: number;
  readonly message_id: string;
  readonly activity_name: string;
  readonly timestamp: string;
  readonly activity_type: string;
  readonly exp: Exp;
}

type Model = Schema | Schema__V0;

export namespace Workout {

  /**
   * A workout is a historical recording of a Strava Activity,
   * with the amount of EXP gained included along with some metadata
   */
  export type Model = Schema & {
    readonly totalExp: number;
    readonly started: DateTime;
    emoji: (emojiSet: EmojiSet) => string;
    extend: (props?: Partial<Schema>) => Model;
    json: () => Schema;
    save: () => Promise<Model>;
  };
  
  export const Model = (data: Schema) : Readonly<Model> => ({
    ...data,
  
    get totalExp() {
      return  match (data.exp, {
        hr:   h => h.moderate + h.vigorous,
        time: t => t.exp
      });
    },
  
    get started() {
      return DateTime
        .fromISO (data.timestamp)
        .toLocal ();
    },
  
    emoji: emojiSet => activityEmoji ({ 
      type: data.activity_type,
      exp:  data.exp
    }, emojiSet),
  
    extend: (props = {}) => Model ({ ...data, ...props }),
  
    json: () => data,

    save: () => save (data)
  });
  
  export const create = (discordId: string, activity: Activity, exp: Exp) : Model => Model ({
    __version:     1,
    discord_id:    discordId,
    activity_id:   activity.id,
    message_id:    '',
    activity_name: activity.name,
    timestamp:     activity.start_date,
    activity_type: activity.type,
    exp:           exp
  });

  export const findOne = async (q: FilterQuery<Schema>, opt: FindOneOptions<Schema> = {}) : Promise<Model | null> => {
    const collection = await getCollection ();
    const model = await collection.findOne (q, opt);
  
    return (model)
      ? migrate (model)
      : null;
  }


  const save = async (workout: Schema) : Promise<Model> => {
    const collection = await getCollection ();
    await collection.replaceOne (
      { activity_id: workout.activity_id },
      workout,
      { upsert: true }
    );

    return Model (workout);
  }

  export const deleteOne = async (workout: Model) : Promise<Model> => {
    const collection = await getCollection ();
    await collection.deleteOne ({ activity_id: workout.activity_id });

    return workout;
  }
}

type Workouts = {
  recordedBy: (discordId: string) => Workouts;
  during:     (interval: Interval) => Workouts;
  limit:      (limit: number) => Workouts;
  find:       () => Promise <Workout.Model[]>
};

export const Workouts = (query: FilterQuery<Schema> = {}, options: FindOneOptions<Schema> = {}) : Workouts => ({
  recordedBy: discord_id => Workouts ({ 
    ...query, 
    discord_id 
  }, options),
  
  during: interval => Workouts ({
    ...query,
    timestamp: {
      $lt: interval.end.toUTC ().toISO (),
      $gt: interval.start.toUTC ().toISO ()
    }
  }, options),
  
  // Weird VSC bug here where this is showing up as an eslint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limit: limit => Workouts (
    query,
    { ...options, limit }
  ),

  find: async () => {
    const collection = await getCollection ();
    return collection
      .find (query, options)
      .toArray ()
      .then (a => a.map (migrate))
  }
});

export const belongsTo = (user: User.Authorized) => (workout: Workout.Model) : boolean => workout.discord_id === user.discordId;

export const Exp = variantModule ({
  hr:   (moderate: number, vigorous: number) => ({ moderate, vigorous }),
  time: (exp: number) => ({ exp })
});

export type Exp<T extends TypeNames<typeof Exp> = undefined>= VariantOf<typeof Exp, T>;


export const sumExp = (workout: Workout.Model[]) : number =>
  workout.map (w => w.totalExp).reduce ((a, b) => a + b, 0);


// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------

const migrate = (model: Model) : Workout.Model => {
  if (!('__version' in model)) {
    const exp = (model.exp_type === 'hr')
      ? Exp.hr (model.exp_gained - model.exp_vigorous, model.exp_vigorous)
      : Exp.time (model.exp_gained);

    return migrate ({ 
      ...model, 
      __version:  1,
      message_id: '',
      exp
    });
  }

  return Workout.Model (model);
}

type Schema__V0 = {
  discord_id: string;
  activity_id: number;
  activity_name: string;
  timestamp: string;
  activity_type: string;
  exp_type: 'hr' | 'time';
  exp_gained: number;
  exp_vigorous: number;
}