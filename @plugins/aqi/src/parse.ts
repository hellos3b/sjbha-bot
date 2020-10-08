import type {AqiSensor} from "./fetch";

import * as R from "ramda";
import * as F from "fluture";
import * as FP from "../fp";

import {Sensors, SensorIds} from "../config";
import {getSensors} from "./fetch";

export interface SensorAverages {
  average: number;
  locations: {
    [key: string]: number;
  };
}

const sensorIdIsIn = (ids: number[]) => (sensor: AqiSensor) => ids.includes (sensor.id);
const aqiProp = (sensor: AqiSensor) => sensor.aqi;

/** A median filter removes noise from an array of values by calculating the median over triplets and creating a new array */
const medianFilter = (arr: number[]) => 
  arr.map((v, idx) => arr.slice(idx, idx + 3))
    .filter(v => v.length === 3)
    .map(R.median);

/** Makes sure an array has a minimum amount of entries */
const hasAtLeast = (len: number) => (arr: any[]) => arr.length > len;

/** Gets the AQI for a group of sensors */
const getAqi = R.pipe(
  R.map (aqiProp),
  R.ifElse (hasAtLeast(3), medianFilter, R.identity),
  FP.average,
  Math.floor
)

/** Get the AQI for a specific location (group of IDs) */
const groupedAqi = (sensors: AqiSensor[]) => (group: number[]) => R.pipe(
  FP.filter (sensorIdIsIn (group)),
  getAqi
)(sensors)

/** Gets the AQI for each specific location group */
const locationAqis = (sensors: AqiSensor[]) => R.zipObj(
  R.keys (Sensors),
  R.values(Sensors).map(groupedAqi (sensors))
)

/** Get the total and location based averages from a list of sensors */
const toAverages = R.applySpec<SensorAverages> ({
  average   : getAqi, 
  locations : locationAqis
})

export const getAverages = () => R.pipe(
  getSensors,
  F.map (toAverages)
)(SensorIds);