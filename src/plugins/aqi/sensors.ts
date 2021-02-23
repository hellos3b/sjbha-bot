import * as TE from "fp-ts/TaskEither";
import * as R from "ramda";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import {pipe} from "fp-ts/function";
import { convert } from "@shootismoke/convert";

import {AsyncClient} from "@packages/async-client";
import { DecodeError, HTTPError } from "@packages/common-errors";
import { description, embed, title, color, footer} from "@packages/embed";

namespace PurpleAir {
  export interface Response {
    readonly results: Sensor[];
  }

  export interface Sensor {
    /** The Sensor ID */
    readonly ID: number;
    /** The sensor ID of the parent if it's channel B */
    readonly ParentID?: number;
    /** Needs to be JSON Stringified */
    readonly Stats: string;
  }

  export interface Stats {
    /** Real time PM2.5 value */
    readonly v: number;
    /** Short term (10 minute average) */
    readonly v1: number;
  }
}

// Locations
const DTSJ = "Downtown San Jose";
const ESJ = "East San Jose";
const SSJ = "South San Jose";
const SC = "Santa Clara";
const MV = "Mountain View";
const SM = "San Mateo";

const sources = [
  {id: 56013, location: DTSJ},
  {id: 64381, location: DTSJ},
  {id: 64881, location: DTSJ},
  {id: 20757, location: ESJ},
  {id: 64881, location: ESJ},
  {id: 56007, location: ESJ},
  {id: 15245, location: SSJ},
  {id: 54205, location: SSJ},
  {id: 54205, location: SSJ},
  {id: 19313, location: SC},
  {id: 70615, location: SC},
  {id: 60819, location: SC},
  {id: 38607, location: MV},
  {id: 62249, location: MV},
  {id: 60819, location: MV},
  {id: 60115, location: SM},
  {id: 59143, location: SM},
  {id: 67283, location: SM}
];

export type SensorAqi = ReturnType<typeof SensorAqi>;
function SensorAqi(id: number, aqi: number) {
  return <const>{id, aqi};
}

export type Location = ReturnType<typeof Location>;
function Location(name: string, aqi: number) {
  return <const>{name, aqi};
}

/**
 * Fetch the sensor data from the API
 */
const fetch = (): TE.TaskEither<HTTPError, PurpleAir.Sensor[]> => pipe(
  AsyncClient().get <PurpleAir.Response>(
    "https://www.purpleair.com/json", 
    {show: sources.map(_ => _.id).join("|")}
  ),
  TE.map (list => list.results)
);

/**
 * Extract the ID & AQI from the purple air response
 * 
 * Returns `left DecodeError` if `Stats` property fails to parse
 */
const getSensorAqi = (sensor: PurpleAir.Sensor): E.Either<DecodeError, SensorAqi> => pipe(
  E.tryCatch(
    (): PurpleAir.Stats => JSON.parse(sensor["Stats"]),
    DecodeError.lazy("Failed to parse 'Stats' object from Purple Air")
  ),
  E.map(stats => SensorAqi(
    (sensor["ParentID"]) ? sensor["ParentID"] : sensor["ID"],
    convert('pm25', 'raw', 'usaEpa', stats["v1"])
  ))
);

/**
 * Get the average aqi from a list of sensors.
 * Uses a median filter to smooth out some obscure values if
 * thare are more than 3 sensors to draw from
 */
const calcAverageAqi = (sensors: SensorAqi[]): number => {
  // A median filter removes noise from an array of values by 
  //calculating the median over triplets and creating a new array 
  const medianFilter = (arr: number[]) => 
    arr.map((v, idx) => arr.slice(idx, idx + 3))
      .filter(v => v.length === 3)
      .map(R.median);

    
  return pipe(
    sensors.map(_ => _.aqi),
    a => (a.length >= 3) ? medianFilter(a) : a,
    R.mean,
    Math.floor
  );
}

/**
 * Sorts an array of sensors into locations, looking at `sources` for a reference
 */
const groupLocationAqi = (data: readonly PurpleAir.Sensor[]): Location[] => {
  const sensors = pipe(data.map(getSensorAqi), A.rights);
  const sensorById = pipe(sensors.map(s => ({[s.id]: s})), R.mergeAll);
  const locations = pipe(sources.map(_ => _.location), R.uniq);

  return locations
    .map(name => Location(
      name, 
      pipe(
        sources.filter(_ => _.location === name),
        A.map(s => sensorById[s.id]), 
        calcAverageAqi
      )
    ));
}

/**
 * Render an embed with location data
 */
const render = (locations: Location[]) => {
  const getColor = (aqi: number) => {
    if (aqi < 50) return 5564977;
    if (aqi < 100) return 16644115;
    if (aqi < 150) return 16354326;
    return 13309719;  
  }

  const emoji = (aqi: number) => {
    if (aqi < 50) return "🟢";
    if (aqi < 100) return "🟡";
    if (aqi < 150) return "🟠";
    return "🔴";
  }

  const locationLine = (location: Location) => 
    `${emoji(location.aqi)} **${location.name}** ${location.aqi}`;

  const average = pipe(locations.map(_ => _.aqi), R.mean, Math.floor);

  return embed(
    title(`Air quality Index • ${average} average`),
    color (getColor(average)),
    description(
      locations
        .map(locationLine)
        .join("\n")
    ),
    footer("Based on a 10 minute average from Purple Air sensors")
  );
};

export const aqiMessage = () => pipe(
  fetch(),
  TE.map (groupLocationAqi),
  TE.map (render)
);
