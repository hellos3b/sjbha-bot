import superagent from 'superagent';
import { strava } from '../env';

export class StravaClient {
  constructor (
    private readonly accessToken: string
  ) {}

  static async authenticate (refreshToken: string) : Promise<StravaClient> {
    const res = await superagent
      .post ('https://www.strava.com/oauth/token')
      .send ({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     strava.CLIENT_ID,
        client_secret: strava.CLIENT_SECRET
      })
      .then (r => r.body as AuthResponse);

    return new StravaClient (res.access_token);
  }

  async getActivity (activityId: number): Promise<Activity> {
    const res = await superagent
      .get (`https://www.strava.com/api/v3/activities/${activityId}`)
      .auth (this.accessToken, { type: 'bearer' });
      
    return res.body as Activity;
  }

  async getActivityStreams (activityId: number): Promise<StreamResponse> {
    const res = await superagent
      .get (`https://www.strava.com/api/v3/activities/${activityId}/streams`)
      .query ({ 'keys': 'heartrate,time' })
      .auth (this.accessToken, { type: 'bearer' });
      
    return res.body as StreamResponse;
  }  
}

export interface AuthResponse {
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
export type ActivityType = 
  | 'AlpineSki' | 'BackcountrySki' | 'Canoeing' | 'Crossfit' | 'EBikeRide' | 'Elliptical' | 'Golf' | 'Handcycle' | 'Hike' 
  | 'IceSkate' | 'InlineSkate' | 'Kayaking' | 'Kitesurf' | 'NordicSki' | 'Ride' | 'RockClimbing' | 'RollerSki' | 'Rowing' 
  | 'Run' | 'Sail' | 'Skateboard' | 'Snowboard' | 'Snowshoe' | 'Soccer' | 'StairStepper' | 'StandUpPaddling' | 'Surfing' 
  | 'Swim' | 'Velomobile' | 'VirtualRide' | 'VirtualRun' | 'Walk' | 'WeightTraining' | 'Wheelchair' | 'Windsurf' | 'Workout' | 'Yoga';

/**
 * Activity response from the strava API
 * @see https://developers.strava.com/docs/reference/#api-models-DetailedActivity
 */
type BaseActivity = {
  readonly id: number;
  readonly athlete: {id: number;}
  readonly start_date: string;
  readonly distance: number;
  readonly moving_time: number;
  readonly elapsed_time: number;
  readonly average_speed: number;
  readonly total_elevation_gain: number;
  readonly type: ActivityType;
  readonly name: string;
  readonly description: string;
  readonly manual: boolean;
  readonly private: boolean;
  readonly visibility: 'everyone' | 'followers_only' | 'only_me';

  /** Workout type is used to check if something is an activity, workout, or race. */
  readonly workout_type: undefined | WorkoutType;
}

/**
 * An activity that was recorded with a heartrate tracker
 */
type ActivityHeartrate = 
  | {
    readonly has_heartrate: false
  }
  | {
    readonly has_heartrate: true;
    readonly average_heartrate: number;
    readonly max_heartrate: number;
  };

type ActivityPower =
  | {
    readonly device_watts: false
  }
  | {
    readonly device_watts: true;
    readonly weighted_average_watts: number;
    readonly max_watts: number;
  }

export type Activity = BaseActivity & ActivityHeartrate & ActivityPower;

export type WorkoutType = typeof WorkoutType[keyof typeof WorkoutType];
export const WorkoutType = <const>{
  Run:            0,
  RunningRace:    1,
  RunningLong:    2,
  RunningWorkout: 3,
  Ride:           10,
  RideRace:       11,
  RideWorkout:    12
};


/**
 * @see https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
 */
export type StreamResponse = Stream[];

export type Stream = {
  readonly type: 'heartrate' | 'time' | string;
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