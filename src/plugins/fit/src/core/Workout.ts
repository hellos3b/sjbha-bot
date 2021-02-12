import type {ActivityType, Activity, ActivityWithHR, Streams} from "../io/strava-types";
import {DateTime} from "luxon";
import {pipe} from "fp-ts/function";
import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";

import * as Units from "./Units";
import * as hr from "./Heartrate";

export type Workout = {
  /** Strava ID for activity */
  readonly id: number;
  /** What kind of activity was recorded */
  readonly type: ActivityType;
  /** Title of the activity */
  readonly title: string;
  /** Description, if any */
  readonly description: string;
  /** Activity is set to private */
  readonly private: boolean;
  /** Time activity started recorded */
  // todo: make an ISO datatype
  readonly started: string;
  /** How long the activity went for. In a GPS activity, this time will reflect time that was spent actually moving */
  readonly elapsed: Units.Seconds;
  /** GPS data, if recorded outdoors */
  readonly gps: O.Option<GPS>;
  /** Heart rate data if recorded with a device */
  readonly heartrate: O.Option<HRData>;
}

export type GPS = {
  readonly distance: Units.Meters;
  readonly elevation: Units.Meters;
  readonly averageSpeed: Units.MetersPerSecond;
}

/** If the user recorded with HR but never set their max heart rate, we can't detail the zones */
export type HRData = {
  readonly average: number;
  readonly max: number;
  readonly stream: hr.Stream;
}

const activityHasGPS = O.fromPredicate<Activity>(_ => _.distance > 0);
const activityHasHR = O.fromPredicate((res: Activity): res is ActivityWithHR => res.has_heartrate);

export const fromActivity = (res: Activity, stream?: Streams): Workout => ({
  id: res.id,
  type: <ActivityType>res.type,
  title: res.name,
  description: res.description,
  private: res.private,
  started: res.start_date,
  elapsed: Units.seconds(res.moving_time),
  gps: pipe(
    activityHasGPS(res),
    O.map(gps)
  ),
  heartrate: pipe(
    activityHasHR(res),
    O.map(heartrate),
    O.map(withStream(stream))
  )
});

export const gps = (res: Activity): GPS => ({
  distance:     Units.meters(res.distance),
  elevation:    Units.meters(res.total_elevation_gain),
  averageSpeed: Units.metersPerSecond(res.average_speed)
});

export const heartrate = (res: ActivityWithHR): HRData => ({
  average: res.average_heartrate,
  max: res.max_heartrate,
  stream: []
});

const withStream = (stream?: Streams) => {
  return (data: HRData) => (!stream) 
    ? data 
    : R.mergeRight(data, {stream: hr.streamFromResponse(stream)});
};