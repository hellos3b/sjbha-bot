import Debug from "debug";
const debug = Debug("@plugins:aqi");

import * as R from "ramda";
import * as F from "fluture";
import {Either} from "purify-ts";

import { convert } from "@shootismoke/convert";
import wretch from "@services/node-wretch";

export interface AqiSensor {
  id: number;
  aqi: number;
}

/** Fetches sensor information from the Purple Air API */
const fetch = (ids: number[]) => F.attemptP(() => 
  wretch()
    .url (`https://www.purpleair.com/json`)
    .query ({show: ids.join("|")})
    .get()
    .json<PurpleAir.API>()
    .then (R.prop ("results"))
);

/** Sensor stats come in as a string, this pulls it out and parses it */
const parseStats = (sensor: PurpleAir.Sensor) => Either.encase<Error, PurpleAir.Stats>(() => JSON.parse(sensor.Stats));

/** Get the last 10 min PM data from a sensor */
const sensorPm = (sensor: PurpleAir.Sensor) => 
  parseStats(sensor)
    .map (R.prop ("v1"))
    .ifLeft (error => debug("Failed to get PM for sensor %o: %O", sensor.ID, error.message))
    .orDefault (0);

/** Convert PM to an AQI value */    
const toAqi = (tenMinPM: number) => convert('pm25', 'raw', 'usaEpa', tenMinPM);

/** Get the sensor's ID. Channel B has it's own unique ID, we'll use the ParentID to group it properly */
const sensorId = (sensor: PurpleAir.Sensor) => !!sensor.ParentID ? sensor.ParentID : sensor.ID;

/** Get a sensor's AQI */
const aqi = R.pipe(sensorPm, toAqi)

/** Removes all the noise from the interface  */
const sensorAqi = R.applySpec<AqiSensor>({
  id: sensorId, 
  aqi
});

/** Get the AQI for all sensor IDs */
export const getSensors = R.pipe(
  fetch,
  F.map (R.map (sensorAqi))
)