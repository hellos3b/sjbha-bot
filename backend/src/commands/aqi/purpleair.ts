import { convert } from '@shootismoke/convert';
import superagent from 'superagent';
import * as R from 'ramda';
import { variantList, TypeNames, VariantOf } from 'variant';

export interface Response {
  readonly results: SensorData[];
}

export interface SensorData {

  /** The Sensor ID */
  readonly ID: number;

  /** The sensor ID of the parent if it's channel B */
  readonly ParentID?: number;

  /** Needs to be JSON Stringified */
  readonly Stats: string;
}

export interface SensorStats {

  /** Real time PM2.5 value */
  readonly v: number;

  /** Short term (10 minute average) */
  readonly v1: number;
}

/**
 * A PurpleAir Sensor
 */
class Sensor {
  constructor (
    private readonly data: SensorData
  ) {}

  /**
   * Primary ID for the sensor
   */
  get id (): number {
    return this.data.ParentID || this.data.ID;
  }

  /**
   * Converts live PM2.5 stats to AQI.
   * There's a possibility that the data isn't formatted properly and may fail
   * 
   * @returns The AQI of the sensor, or an error from parsing JSON
   */
  getAQI () : Error | number {
    try {
      const stats: SensorStats = JSON.parse (this.data.Stats);

      return convert ('pm25', 'raw', 'usaEpa', stats.v1);
    }
    catch (e) {
      return (e instanceof Error) ? e : new Error ('An error occured when trying to parse AQI stats');
    }
  }
}

export class SensorCollection {
  constructor (
    private readonly sensors: Sensor[]
  ) {}

  /**
   * Picks a sub sample of sensors 
   * 
   * @param ids 
   * @returns 
   */
  filter (ids: number[]) : SensorCollection {
    const sensors = this.sensors.filter (sensor => ids.includes (sensor.id));

    return new SensorCollection (sensors);
  }

  /**
   * Averages the AQI of all the sensors, while trying to filter any irregular spikes
   * 
   * @returns The average AQI of all sensors in this collection
   */
  getAverageAqi () : AQI {
    // A median filter removes noise from an array of values by calculating the median over triplets and creating a new array 
    const medianFilter = (arr: number[]) => {
      // Requires at least 3 to work
      if (arr.length < 3)
        return arr;

      return arr.map ((v, idx) => arr.slice (idx, idx + 3))
        .filter (v => v.length === 3)
        .map (R.median);
    }

    const values = this.sensors
      .map (s => s.getAQI ())
      .filter ((s): s is number => typeof s === 'number');

    const smoothed = medianFilter (values);

    return new AQI (R.mean (smoothed));
  }

  /**
   * Load a series of IDs from the PurpleAir API
   * 
   * @returns A Sensor manager
   */
  static fetchIds = async (ids: number[]) : Promise<SensorCollection> => {
    const response = await superagent
      .get ('https://www.purpleair.com/json')
      .query ({ show: ids.join ('|') })
      .then (r => <Response>r.body);
  
    const sensors = response.results.map (s => new Sensor (s));
  
    return new SensorCollection (sensors);
  }
}

/**
 * A readable impression of the aqi number
 */
const Level = variantList ([
  'good',
  'sketchy',
  'bad',
  'terrible'
]);

export type Level<T extends TypeNames<typeof Level> = undefined>= VariantOf<typeof Level, T>;

export class AQI {
  constructor (
    public readonly value: number
  ) {}

  get level () : Level {
    if (this.value < 50)
      return Level.good ();

    if (this.value < 100)
      return Level.sketchy ();

    if (this.value < 150)
      return Level.bad ();

    return Level.terrible ();
  }

  toString () : string {
    return this.value.toFixed (0);
  }
}