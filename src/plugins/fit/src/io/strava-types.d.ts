
export interface Auth {
  readonly refresh_token: string;
  readonly access_token: string;
  readonly athlete: { 
    readonly id: number; 
    readonly sex: 'M'|'F';
  }  
}

/** 
 * @see https://developers.strava.com/docs/reference/#api-models-ActivityType 
 */
export type ActivityType = "AlpineSki" | "BackcountrySki" | "Canoeing" | "Crossfit" | "EBikeRide" | "Elliptical" | "Golf" | "Handcycle" | "Hike" | "IceSkate" | "InlineSkate" | "Kayaking" | "Kitesurf" | "NordicSki" | "Ride" | "RockClimbing" | "RollerSki" | "Rowing" | "Run" | "Sail" | "Skateboard" | "Snowboard" | "Snowshoe" | "Soccer" | "StairStepper" | "StandUpPaddling" | "Surfing" | "Swim" | "Velomobile" | "VirtualRide" | "VirtualRun" | "Walk" | "WeightTraining" | "Wheelchair" | "Windsurf" | "Workout" | "Yoga";

/**
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

export type ActivityWithHR = Activity & {
  readonly has_heartrate: true;
  readonly average_heartrate: number;
  readonly max_heartrate: number;
}

/**
 * @see http://developers.strava.com/docs/reference/#api-models-DetailedAthlete
 */
// interface AthleteResponse {
//   id: number;
// }


/**
 * @see https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
 */
export type Streams = Array<{
  readonly type: "heartrate" | "time" | string;
  readonly data: number[];
}>;