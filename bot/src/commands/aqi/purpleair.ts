import { convert } from '@shootismoke/convert';
import superagent from 'superagent';
import * as R from 'ramda';


// A readable impression of the aqi number
export type level =
  | 'good'
  | 'sketchy'
  | 'bad'
  | 'terrible'

export type sensorData = {
  ID: number;
  // Each sensor has two readings (channel A | B)
  // and if theres a ParentID then that means we're looking at channel B
  ParentID?: number;
  // Needs to be JSON Stringified
  Stats: string;
}

// Comes in the 'Stats' field of sensor data
type sensorStats = {
  // Real time PM2.5 value
  readonly v: number;
  // Short term (10 minute average)
  readonly v1: number;
}

export type response = {
  results: sensorData[];
}

const DTSJ = 'Downtown San Jose';
const ESJ = 'East San Jose';
const SSJ = 'South San Jose';
const SC = 'Santa Clara';
const MV = 'Mountain View';
const SM = 'San Mateo';

const sensors = [
  { id: 56013, location: DTSJ },
  { id: 64381, location: DTSJ },
  { id: 64881, location: DTSJ },
  { id: 20757, location: ESJ },
  { id: 64881, location: ESJ },
  { id: 56007, location: ESJ },
  { id: 15245, location: SSJ },
  { id: 54205, location: SSJ },
  { id: 54205, location: SSJ },
  { id: 19313, location: SC },
  { id: 70615, location: SC },
  { id: 60819, location: SC },
  { id: 38607, location: MV },
  { id: 62249, location: MV },
  { id: 60819, location: MV },
  { id: 60115, location: SM },
  { id: 59143, location: SM },
  { id: 67283, location: SM }
];

export const locations = [DTSJ, ESJ, SSJ, SC, MV, SM];

export const sensorIds = sensors.map(_ => _.id);

export const sensorsByLocation = (location: string): number[] =>
  sensors.filter(source => source.location === location)
    .map(source => source.id);

// A PurpleAir Sensor
class Sensor {
  constructor(
    private readonly data: sensorData
  ) { }

  /**
   * Primary ID for the sensor
   */
  get id(): number {
    return this.data.ParentID || this.data.ID;
  }

  /**
   * Converts live PM2.5 stats to AQI.
   * There's a possibility that the data isn't formatted properly and may fail
   * 
   * @returns The AQI of the sensor, or an error from parsing JSON
   */
  getAQI(): Error | number {
    try {
      const stats: sensorStats = JSON.parse(this.data.Stats);

      return convert('pm25', 'raw', 'usaEpa', stats.v1);
    }
    catch (e) {
      return (e instanceof Error) ? e : new Error('An error occured when trying to parse AQI stats');
    }
  }
}

export class SensorCollection {
  constructor(
    private readonly sensors: Sensor[]
  ) { }

  /**
   * Picks a sub sample of sensors 
   * 
   * @param ids 
   * @returns 
   */
  filter(ids: number[]): SensorCollection {
    const sensors = this.sensors.filter(sensor => ids.includes(sensor.id));

    return new SensorCollection(sensors);
  }

  /**
   * Averages the AQI of all the sensors, while trying to filter any irregular spikes
   * 
   * @returns The average AQI of all sensors in this collection
   */
  getAverageAqi(): AQI {
    // A median filter removes noise from an array of values by calculating the median over triplets and creating a new array 
    const medianFilter = (arr: number[]) => {
      // Requires at least 3 to work
      if (arr.length < 3)
        return arr;

      return arr.map((_, idx) => arr.slice(idx, idx + 3))
        .filter(v => v.length === 3)
        .map(R.median);
    }

    const values = this.sensors
      .map(s => s.getAQI())
      .filter((s): s is number => typeof s === 'number');

    const smoothed = medianFilter(values);

    return new AQI(R.mean(smoothed));
  }

  /**
   * Load a series of IDs from the PurpleAir API
   * 
   * @returns A Sensor manager
   */
  static fetchIds = async (ids: number[]): Promise<SensorCollection> => {
    const response = await superagent
      .get('https://www.purpleair.com/json')
      .query({ show: ids.join('|') })
      .then(r => <response>r.body);

    const sensors = response.results.map(s => new Sensor(s));

    return new SensorCollection(sensors);
  }
}

export class AQI {
  constructor(
    public readonly value: number
  ) { }

  get level(): level {
    if (this.value < 50)
      return 'good';

    if (this.value < 100)
      return 'sketchy';

    if (this.value < 150)
      return 'bad';

    return 'terrible';
  }

  toString(): string {
    return this.value.toFixed(0);
  }
}