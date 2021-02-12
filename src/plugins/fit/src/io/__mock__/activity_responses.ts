import { props } from "ramda";
import {Activity, ActivityWithHR} from "../strava-types";

type Response = Activity | ActivityWithHR;

const base: Response = {
  id: 123,
  athlete: {id: 123},
  name: "activity name",
  description: "activity description",
  start_date: "2021-02-11T02:20:12Z",
  distance: 0,
  moving_time: 3600,
  average_speed: 0,
  total_elevation_gain: 0,
  type: "Workout",
  manual: false,
  private: false,
  has_heartrate: false
};

const extend = (json: Partial<Response>): Response => 
  Object.assign({}, base, json);

export const activity_indoor_with_heartrate = extend({
  distance: 0,
  manual: false,
  has_heartrate: true,
  average_heartrate: 140,
  max_heartrate: 180
});

export const activity_outdoor_with_heartrate = extend({
  type: "Run",
  distance: 5000,
  total_elevation_gain: 100,
  manual: false,
  has_heartrate: true,
  average_heartrate: 140,
  max_heartrate: 180,
  average_speed: 3600 / 5000
});

export const activity_outdoor_no_heartrate = extend({
  type: "Run",
  distance: 5000,
  total_elevation_gain: 100,
  manual: false,
  has_heartrate: false,
  average_speed: 3600 / 5000
});

export const activity_manual_run = extend({
  type: "Run",
  distance: 5000,
  total_elevation_gain: 100,
  manual: true,
  average_speed: 3600 / 5000  
});

export const activity_manual_workout = extend({
  type: "Workout",
  distance: 0,
  manual: true
})

/** @from /api/v3/activities/{id}/streams?keys=time,heartrate */
export const blank_stream = [
  {
    "type": "heartrate",
    "data": [],
    "series_type": "time",
    "original_size": 1648,
    "resolution": "high"
  },
  {
    "type": "time",
    "data": [],
    "series_type": "time",
    "original_size": 1648,
    "resolution": "high"
  }
]