import { match } from "ts-pattern";

// The activity model that is returned from the strava API
// https://developers.strava.com/docs/reference/#api-models-DetailedActivity
export type activity = {
  id: number;
  athlete: { id: number; }
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  total_elevation_gain: number;
  type: string;
  name: string;
  description: string;
  manual: boolean;
  private: boolean;
  visibility: "everyone" | "followers_only" | "only_me";

  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;

  device_watts: boolean;
  weighted_average_watts?: number;
  max_watts?: number;

  // Workout type is used to check if something is an activity, workout, or race.
  workout_type: undefined | number;  
}

export type heartRate = { 
  average: number; 
  max: number; 
}

export type power = {
  average: number; 
  max: number; 
}

// The type of actual workout, is a dropdown and you can differentiate
// between a race or workout, etc
export type workoutType =
  | "default"
  | "race"
  | "long-run"
  | "workout"
  
// The activity type. This list is not exhaustive, but handpicked with what we want to treat differently
// https://developers.strava.com/docs/reference/#api-models-ActivityType
export const type = {
   Ride:           "Ride",
   Run:            "Run",
   Yoga:           "Yoga",
   Hike:           "Hike",
   Walk:           "Walk",
   Workout:        "Workout",
   Crossfit:       "Crossfit",
   VirtualRide:    "VirtualRide",
   RockClimbing:   "RockClimbing",
   WeightTraining: "WeightTraining"
};

export const heartRate = (a: activity) : heartRate | null =>
   (a.has_heartrate)
      ? ({ average: a.average_heartrate ?? 0, max: a.max_heartrate ?? 0 })
      : null;

export const power = (a: activity) : power | null =>
   (a.device_watts)
      ? ({ average: a.weighted_average_watts ?? 0, max: a.max_watts ?? 0 })
      : null;

export const workoutType = (a: activity) : workoutType => {
   const type = (type: workoutType) => () => type;

   // the numbers were found just by examining the strava API closely
   // and switching between the settings. I'm sure there are more values
   // but these are the only ones we care about
   return match (a.workout_type)
      .with (0, type ("default"))  // Run
      .with (1, type ("race")) // run + race
      .with (2, type ("long-run")) // run has a unique one for a long run
      .with (3, type ("workout")) // run + workout
      .with (10, type ("default")) // ride
      .with (11, type ("race")) // ride + race
      .with (12, type ("workout")) // ride + workout
      .otherwise (type ("default"));
};
