import * as strava from "../io/strava-types";
import * as A from "fp-ts/Array";
import * as Time from "./Time";

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
  readonly rest: Time.Duration;
  readonly moderate: Time.Duration;
  readonly vigorous: Time.Duration;
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
  const time = {rest: 0, moderate: 0, vigorous: 0};
  
  return (stream: Stream): TimeInZones => {
    const t = stream.reduce((res, sample) => {
      switch (zone(sample.bpm)) {
        case "vigorous": 
          return {...res, vigorous: res.vigorous + sample.seconds};
        case "moderate": 
          return {...res, moderate: res.moderate + sample.seconds};
        default: 
          return {...res, rest: res.rest + sample.seconds};
      }
    }, time);

    return {
      rest: Time.seconds(t.rest),
      moderate: Time.seconds(t.moderate),
      vigorous: Time.seconds(t.vigorous)
    }
  }
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