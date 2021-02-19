import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import {sequenceT} from "fp-ts/Apply";
import {pipe, flow} from "fp-ts/function";

import { DateTime, Duration } from "luxon";

import * as env from "../../env";
import {AsyncClient} from "@packages/async-client";

import * as Distance from "./Distance";

namespace API {
  export interface Auth {
    readonly refresh_token: string;
    readonly access_token: string;
    readonly athlete: { 
      readonly id: number; 
      readonly sex: 'M'|'F';
    }  
  }

  /** 
   * Available activity types from the strava API
   * @see https://developers.strava.com/docs/reference/#api-models-ActivityType 
   */
  export type ActivityType = "AlpineSki" | "BackcountrySki" | "Canoeing" | "Crossfit" | "EBikeRide" | "Elliptical" | "Golf" | "Handcycle" | "Hike" | "IceSkate" | "InlineSkate" | "Kayaking" | "Kitesurf" | "NordicSki" | "Ride" | "RockClimbing" | "RollerSki" | "Rowing" | "Run" | "Sail" | "Skateboard" | "Snowboard" | "Snowshoe" | "Soccer" | "StairStepper" | "StandUpPaddling" | "Surfing" | "Swim" | "Velomobile" | "VirtualRide" | "VirtualRun" | "Walk" | "WeightTraining" | "Wheelchair" | "Windsurf" | "Workout" | "Yoga";

  /**
   * Activity response from the strava API
   * @see https://developers.strava.com/docs/reference/#api-models-DetailedActivity
   */
  export type Activity = {
    readonly id: number;
    readonly athlete: {id: number;}
    readonly start_date: string;
    readonly distance: number;
    readonly moving_time: number;
    readonly average_speed: number;
    readonly total_elevation_gain: number;
    readonly type: string;
    readonly name: string;
    readonly description: string;
    readonly manual: boolean;
    readonly private: boolean;
    readonly has_heartrate: boolean;
  }

  /**
   * An activity that was recorded with a heartrate tracker
   */
  export type ActivityWithHR = Activity & {
    readonly has_heartrate: true;
    readonly average_heartrate: number;
    readonly max_heartrate: number;
  }

  /**
   * @see https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
   */
  export type Streams = Stream[];

  export type Stream = {
    readonly type: "heartrate" | "time" | string;
    readonly data: number[];
  };

  export type Pageable = {
    /** Epoch time */
    before?: number;
    /** Epoch time */
    after?: number;
    /** Defaults to 1 */
    page?: number;
    per_page?: number;  
  }
}

export type Workout = {
  /** Strava ID for activity */
  readonly id: number;
  /** What kind of activity was recorded */
  readonly type: API.ActivityType;
  /** The time that activity started */
  readonly timestamp: DateTime;
  /** Title of the activity */
  readonly title: string;
  /** Description, if any */
  readonly description: string;
  /** Activity is set to private */
  readonly private: boolean;
  /** How long the activity went for. In a GPS activity, this time will reflect time that was spent actually moving */
  readonly elapsed: Duration;
  /** GPS data, if recorded outdoors */
  readonly gps: O.Option<GPS>;
  /** Heart rate data if recorded with a device */
  readonly heartrate: O.Option<Heartrate>;
}

export type GPS = {
  readonly distance: Distance.Meters;
  readonly elevation: Distance.Meters;
  readonly averageSpeed: Distance.MetersPerSecond;
}

export type Heartrate = {
 readonly average: number;
 readonly max: number;
 readonly stream: HRStream;
}

/**
 * When recording an activity with HR, they get sampled at a rate (ex. "every second")
 * A `StreamSample` represents one of those sample, and how long it was till the next sample
 */
export type HRSample = {
  /** How long this sample lasted */
  readonly seconds: number;
  /** The heartrate for this time period */
  readonly bpm: number;
}

export type HRStream = HRSample[];

const createStravaClient = flow(
  (refreshToken: string) => AsyncClient()
    .post<API.Auth>('https://www.strava.com/oauth/token', {
      grant_type    : "refresh_token",
      refresh_token : refreshToken,
      client_id: env.client_id, 
      client_secret: env.client_secret
    }),
  TE.map
    (_ => AsyncClient({
      baseURL: 'https://www.strava.com/api/v3',
      headers: {"Authorization": "Bearer " + _.access_token}
    }))
);

/**
 * Return a single workout by ID
 */
export const fetch = (id: string) => flow(
  createStravaClient,
  TE.chain
    (client => sequenceT(TE.taskEither)(
      client.get<API.Activity>('/activities/' + id),
      client.get<API.Streams>('/activities/' + id + '/streams', {keys: "heartrate,time"})
    )),
  TE.map
    (args => fromActivity(...args)),
  TE.mapLeft
    (err => err.withMessage(`Failed to fetch activity '${id}'`))
);

export const fromActivity = (res: API.Activity, stream?: API.Streams): Workout => ({
  id: res.id,
  type: <API.ActivityType>res.type,
  title: res.name,
  description: res.description,
  private: res.private,
  timestamp: DateTime.fromISO(res.start_date),
  elapsed: Duration.fromObject({seconds: res.moving_time}),
  gps: (res.distance > 0)
    ? O.some(gpsFromActivity(res))
    : O.none,
  heartrate: (res.has_heartrate)
    ? O.some (hrFromActivity(<API.ActivityWithHR>res, stream))
    : O.none
});

export const gpsFromActivity = (res: API.Activity): GPS => ({
  distance:     Distance.meters(res.distance),
  elevation:    Distance.meters(res.total_elevation_gain),
  averageSpeed: Distance.ms(res.average_speed)
});

export const hrFromActivity = (activity: API.ActivityWithHR, stream?: API.Streams): Heartrate => ({
  average: activity.average_heartrate,
  max: activity.max_heartrate,
  stream: (!stream) ? [] : Stream(stream)
});

/** 
 * Zips the HR and Time stream from the API together,
 * and changes time to relative instead of absolute
*/
export const Stream = (stream: API.Streams): HRStream => {
  const heartrate = stream.find(_ => _.type === "heartrate");
  const time = stream.find(_ => _.type === "time");

  // Not sure if this should occur, but protecting just in case
  if (!heartrate || !time) return [];

  return A.makeBy(heartrate.data.length, (i: number): HRSample => ({
    bpm: heartrate.data[i],
    seconds: (time.data[i + 1])
      ? (time.data[i + 1] - time.data[i])
      : 0
  }));
}