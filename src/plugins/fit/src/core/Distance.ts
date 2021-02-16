import {pipe} from "fp-ts/function";
import format from "@packages/string-format";
import * as Time from "./Time";

// Distance
export interface Meters {
  _tag: "Meters";
  value: number;
};

export interface Feet {
  _tag: "Feet";
  value: number;
}

export interface Speed {
  readonly mph: string;
  readonly pace: string;
}

export const speed = (ms: number): Speed => ({
  mph: pipe(
    ms * 2.237,
    Math.floor,
    format("{0}mph")
  ),

  pace: pipe(
    Time.seconds((26.8224 / ms) * 60), // minutes per mile
    t => (t.as("hours") > 0) 
      ? t.toFormat("hh:mm:ss")
      : t.toFormat("mm:ss")
  )
});

// Constructors
export const meters = (value: number): Meters => ({_tag: "Meters", value});

// Converters
export const toMiles = (m: Meters) => m.value * 0.000621371192;

export const toFeet = (m: Meters): Feet => ({
  _tag: "Feet",
  value: m.value * 3.2808399
});