import * as RTE from "fp-ts/ReaderTaskEither";
import {taskEither, map, mapLeft, chain} from "fp-ts/TaskEither";
import {pipe, flow} from "fp-ts/function";
import {sequenceT} from "fp-ts/Apply";

import * as env from "../../env";
import * as http from "@packages/http-client";

export namespace API {
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
    readonly elapsed_time: number;
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

/**
 * Creates an authorized client
 */
export const createClient = (refreshToken: string) => pipe(
  http.Client(),
  http.post<API.Auth>('https://www.strava.com/oauth/token', {
      grant_type    : "refresh_token",
      refresh_token : refreshToken,
      client_id: env.client_id, 
      client_secret: env.client_secret
    }),
  map
    (_ => http.Client({
      baseURL: 'https://www.strava.com/api/v3',
      headers: {"Authorization": "Bearer " + _.access_token}
    })),
  mapLeft
    (err => err.withMessage(`Failed to get auth token from strava`))
);

/**
 * Return a single workout by ID
 */
export const fetchActivity = (id: number) => {
  const fetchStreams = (id: number) => pipe(
    http.get<API.Streams>('/activities/' + id + '/streams', {keys: "heartrate,time"}),
    RTE.orElse(() => RTE.right(<API.Streams>[]))
  )

  return flow(
    createClient,
    chain
      (client => sequenceT(taskEither)(
        http.get<API.Activity>('/activities/' + id)(client),
        fetchStreams(id)(client)
      )),
    mapLeft
      (err => err.withMessage(`Failed to fetch activity '${id}'`))
  );
}