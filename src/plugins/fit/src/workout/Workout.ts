import type {ActivityType, ActivityResponse, ActivityResponseWithHR, StreamsResponse} from "../io/strava-types";
import {DateTime} from "luxon";
import {pipe} from "fp-ts/function";
import * as R from "ramda";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as Units from "./Units";

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
  readonly started: DateTime;
  /** How long the activity went for. In a GPS activity, this time will reflect time that was spent actually moving */
  readonly time: Units.Seconds;
  /** GPS data, if recorded outdoors */
  readonly gps: O.Option<GPS>;
  /** Heart rate data if recorded with a device */
  readonly heartrate: O.Option<HR>;
}

export type GPS = {
  readonly distance: Units.Meters;
  readonly elevation: Units.Meters;
  readonly averageSpeed: Units.MetersPerSecond;
}

/** If the user recorded with HR but never set their max heart rate, we can't detail the zones */
export type HR = {
  readonly average: number;
  readonly max: number;
  readonly stream: HRSample[];
}

export type HRSample = {
  /** How long this sample lasted */
  readonly seconds: number;
  /** The heartrate for this time period */
  readonly hr: number;
}

export type Zones = {
  readonly rest: number;
  readonly moderate: number;
  readonly vigorous: number;
}

const activityHasGPS = O.fromPredicate<ActivityResponse>(_ => _.distance > 0);
const activityHasHR = O.fromPredicate((res: ActivityResponse): res is ActivityResponseWithHR => res.has_heartrate);

export const fromActivity = (res: ActivityResponse, stream?: StreamsResponse): Workout => ({
  id: res.id,
  type: <ActivityType>res.type,
  title: res.name,
  description: res.description,
  private: res.private,
  started: DateTime.fromISO(res.start_date),
  time: Units.seconds(res.moving_time),
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

export const gps = (res: ActivityResponse): GPS => ({
  distance:     Units.meters(res.distance),
  elevation:    Units.meters(res.total_elevation_gain),
  averageSpeed: Units.metersPerSecond(res.average_speed)
});

export const heartrate = (res: ActivityResponseWithHR): HR => ({
  average: res.average_heartrate,
  max: res.max_heartrate,
  stream: []
});

const withStream = (stream?: StreamsResponse) => (hr: HR) => 
  !stream ? hr : R.mergeRight(hr, {stream: streams(stream)});

/** 
 * Zips the HR and Time stream from the API together,
 * and changes time to relative instead of absolute
*/
export const streams = (stream: StreamsResponse): HRSample[] => {
  const heartrate = stream.find(_ => _.type === "heartrate");
  const time = stream.find(_ => _.type === "time");

  // Not sure if this should occur, but protecting just in case
  if (!heartrate || !time) return [];

  return A.makeBy(heartrate.data.length, (i: number): HRSample => ({
    hr: heartrate.data[i],
    seconds: time.data[i] - (time.data[i - 1] || 0)
  }));
}

/**
 * Calculates how long a workout was spent in a 'zone', based off of max heartrate
 */
export const timeInZone = (maxHeartrate: number) => {
  const zones: Zones = {
    rest: 0,
    moderate: 0,
    vigorous: 0
  };

  const vigorous = maxHeartrate * 0.75;
  const moderate = maxHeartrate * 0.5;

  const getZone = (hr: number) =>
    (hr >= vigorous) ? "vigorous"
      : (hr >= moderate) ? "moderate"
      : "rest";

  return R.reduce((res, sample: HRSample) => {
    switch (getZone(sample.hr)) {
      case "vigorous": 
        return R.mergeRight(res, {vigorous: res.vigorous + sample.seconds});
      case "moderate": 
        return R.mergeRight(res, {moderate: res.moderate + sample.seconds});
      default: 
        return R.mergeRight(res, {rest: res.rest + sample.seconds});
    }
  }, zones);
};