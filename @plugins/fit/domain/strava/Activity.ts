import {DateTime} from "luxon";
import type {ActivityResponse} from "../../strava-client";

import Seconds from "./Seconds";
import Meters from "./Meters";

import {TIME_ZONE} from "@app/env";

/** Normalized % of HR to be in this zone */
const MODERATE_HR = 0.5;
const VIGOROUS_HR = 0.75;

interface Effort {
  vigorous: number;
  moderate: number;
}

export interface Streams {
  heartrate: number[];
  time: number[];
}

/**
 * A wrapper for activity data from strava, maps multiple fields into value objects
 * and ensures immutability
 */
export default class Activity {
  private readonly _data: ActivityResponse;
  private readonly _streams: Streams | null;

  private constructor(data: ActivityResponse, streams: Streams | null) {
    this._data = data;
    this._streams = streams;
  }

  get id() {
    return this._data.id;
  }

  get name() { 
    return this._data.name; 
  }

  get description() { 
    return this._data.description; 
  }

  get type() { 
    return this._data.type; 
  }

  get distance() { 
    // todo: check if required (might just equal 0)?
    if (!this._data.distance) throw new Error("This activity doesn't have a distance parameter!")
    return new Meters(this._data.distance); 
  }

  get elapsedTime() { 
    return new Seconds(this._data.elapsed_time); 
  }

  get hasHeartrate() {
    return this._data.has_heartrate;
  }

  get avgHeartrate() {
    return this._data.average_heartrate;
  }

  get maxHeartrate() {
    return this._data.max_heartrate;
  }

  get elevation() {
    return new Meters(this._data.total_elevation_gain || -1);
  }

  get timestamp() {
    return DateTime.fromISO(this._data.start_date);
  }

  get localTimestamp() {
    return this.timestamp.setZone(TIME_ZONE);
  }

  get speed() {
    return new Meters(this._data.average_speed);
  }

  get hrStream() {
    if (!this._streams) return []
    return this._streams.heartrate;
  }

  get timeStream() {
    if (!this._streams) return []
    return this._streams.time;
  }

  public getEffort(maxHR: number): Effort {
    if (!this._streams) {
      throw new Error("No stream data available. Check if activity.hasHeartrate before calling getEffort");
    }

    const zones = Activity.getEffortZones(maxHR);
    const heartrate = this.hrStream;
    const time = this.timeStream;

    let moderate = 0;
    let vigorous = 0;

    for (let i = 0; i < heartrate.length; i++) {
      // How long this HR was in zone
      const seconds = (i === 0) ? time[i] : time[i] - time[i - 1];
      const hr = heartrate[i];

      if (hr >= zones.vigorous) {
        vigorous += seconds;
      } else if (hr >= zones.moderate) {
        moderate += seconds;
      }
    }
       
    return {vigorous, moderate};
  }

  public static getEffortZones(maxHR: number) {
    return {
      moderate: maxHR * MODERATE_HR,
      vigorous: maxHR * VIGOROUS_HR
    }
  }

  public static fromAPI(data: ActivityResponse, streams?: Streams) {
    return new Activity(data, streams || null);
  }
}