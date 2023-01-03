/* eslint-disable max-len */
import { DateTime, Interval } from "luxon";
import { FilterQuery, FindOneOptions } from "mongodb";
import { getCollection } from "../../deprecating/legacy_instance";
import * as Activity from "./Activity";
import * as User from "./User";
import * as WorkoutMigration from "./WorkoutMigration";
import * as Exp from "./Exp";

export type workout = {
  readonly __version: 1;
  readonly discord_id: string;
  readonly activity_id: number;
  readonly message_id: string;
  readonly activity_name: string;
  readonly timestamp: string;
  readonly activity_type: string;
  readonly exp: Exp.exp;
}

const collection = () =>
   getCollection<workout | WorkoutMigration.legacy> ("fit-exp");

export const make = (discordId: string, activity: Activity.activity, exp: Exp.exp) : workout => ({
   __version:     1,
   discord_id:    discordId,
   activity_id:   activity.id,
   message_id:    "",
   activity_name: activity.name,
   timestamp:     activity.start_date,
   activity_type: activity.type,
   exp:           exp
});

// -- SELECTORS
export const started = (w: workout) : DateTime =>
   DateTime.fromISO (w.timestamp).toLocal ();

export const belongsTo = (user: User.authorized) => 
   (workout: workout) : boolean => workout.discord_id === user.discordId;

export const recordedBy = (discordId: string) : FilterQuery<workout> =>
   ({ discord_id: discordId });

export const during = (interval: Interval) : FilterQuery<workout> => ({
   timestamp: {
      $lt: interval.end.toUTC ().toISO (),
      $gt: interval.start.toUTC ().toISO ()
   }
});

export const exp = (workouts: workout[]) : number =>
   workouts.map (w => Exp.total (w.exp)).reduce ((a, b) => a + b, 0);

// -- DB
export const findOne = async (q: FilterQuery<workout>, opt: FindOneOptions<workout> = {}) : Promise<workout | null> => {
   const model = await (await collection ()).findOne (q, opt);

   return (model)
      ? WorkoutMigration.migrate (model)
      : null;
};

export const find = async (q: FilterQuery<workout>, opt: FindOneOptions<workout> = {}) : Promise<workout[]> =>
   (await collection ())
      .find (q, opt)
      .toArray ()
      .then (a => a.map (WorkoutMigration.migrate));

export const save = async (workout: workout) : Promise<void> => {
   await (await collection ())
      .replaceOne (
         { activity_id: workout.activity_id },
         workout,
         { upsert: true }
      );
};

export const deleteOne = async (workout: workout) : Promise<void> => {
   await (await collection ()).deleteOne ({ activity_id: workout.activity_id });
};