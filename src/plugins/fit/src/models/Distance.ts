import {pipe} from "fp-ts/function";
import format from "@packages/string-format";
import * as L from "luxon";

// Distance
export interface Meters {
  _tag: "Meters";
  value: number;
};

export interface Feet {
  _tag: "Feet";
  value: number;
}

export interface MetersPerSecond {
  _tag: "MetersPerSecond";
  value: number;
}

export const ms = (value: number): MetersPerSecond => ({_tag: "MetersPerSecond", value});

export const toPace = (ms: MetersPerSecond) => pipe(
  // minutes per mile
  L.Duration.fromObject({
    minutes: (26.8224 / ms.value)
  }),
  t => (t.as("hours") > 1) 
    ? t.toFormat("hh:mm:ss")
    : t.toFormat("mm:ss")
)

export const toMph = (ms: MetersPerSecond) => pipe(
  ms.value * 2.237,
  Math.floor,
  format("{0}mph")
)

// Constructors
export const meters = (value: number): Meters => ({_tag: "Meters", value});

// Converters
export const toMiles = (m: Meters) => (m.value * 0.000621371192).toFixed(2) + "mi";
export const toFeet = (m: Meters) => (m.value * 3.2808399).toFixed(0) + "ft";