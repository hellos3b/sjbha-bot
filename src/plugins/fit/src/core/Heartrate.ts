import * as strava from "../io/strava-types";
import * as R from "ramda";
import * as A from "fp-ts/Array";

/**
 * Basic zone targets for working out
 */
export type Zones = {
  readonly _tag: "Zones";
  readonly max: number;
  readonly vigorous: number;
  readonly moderate: number;
}

/**
 * A breakdown of time spent in each zone
 */
export type TimeInZones = {
  readonly rest: number;
  readonly moderate: number;
  readonly vigorous: number;
}

/**
 * When recording an activity with HR, they get sampled at a rate (ex. "every second")
 * A `StreamSample` represents one of those sample, and how long it was till the next sample
 */
export type StreamSample = {
  /** How long this sample lasted */
  readonly seconds: number;
  /** The heartrate for this time period */
  readonly bpm: number;
}

export type Stream = StreamSample[];

export const zones = (max: number): Zones => ({
  _tag: "Zones",
  max,
  moderate: max * 0.5,
  vigorous: max * 0.75
});

/** 
 * Zips the HR and Time stream from the API together,
 * and changes time to relative instead of absolute
*/
export const streamFromResponse = (stream: strava.Streams): Stream => {
  const heartrate = stream.find(_ => _.type === "heartrate");
  const time = stream.find(_ => _.type === "time");

  // Not sure if this should occur, but protecting just in case
  if (!heartrate || !time) return [];

  return A.makeBy(heartrate.data.length, (i: number): StreamSample => ({
    bpm: heartrate.data[i],
    seconds: (time.data[i + 1])
      ? (time.data[i + 1] - time.data[i])
      : 0
  }));
}

/**
 * Calculates how long a workout was spent in a 'zone', based off of max heartrate
 */
export const timeInZone = (zones: Zones) => {
  const zone = getZone(zones);

  return (stream: Stream) => stream.reduce((res: TimeInZones, sample) => {
    switch (zone(sample.bpm)) {
      case "vigorous": 
        return R.mergeRight(res, {vigorous: res.vigorous + sample.seconds});
      case "moderate": 
        return R.mergeRight(res, {moderate: res.moderate + sample.seconds});
      default: 
        return R.mergeRight(res, {rest: res.rest + sample.seconds});
    }
  }, {rest: 0, moderate: 0, vigorous: 0});
};

/**
 * Returns which zone a heartrate falls in which zone
 */
export const getZone = (zones: Zones) => {
  return (hr: number) =>
    (hr >= zones.vigorous) ? "vigorous"
      : (hr >= zones.moderate) ? "moderate"
      : "rest";
}