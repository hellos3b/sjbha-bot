import {pipe} from "fp-ts/function";
import format from "@packages/string-format";

// Distance
export interface Meters {
  _tag: "Meters";
  value: number;
};

export interface Miles {
  _tag: "Miles";
  value: number;
}

export interface Feet {
  _tag: "Feet";
  value: number;
}

// Time
export interface Seconds {
  _tag: "Seconds";
  value: number;
}

export interface Time {
  readonly seconds: number;
  readonly minutes: number;
  readonly hours: number;
}

// Speed
export interface MetersPerSecond {
  _tag: "MetersPerSecond";
  value: number;
}

export interface MilesPerHour {
  _tag: "MilesPerHour";
  value: number;
}

export interface Pace {
  _tag: "Pace";
  value: Time;
}

export type Speed = MilesPerHour | MetersPerSecond | Pace;

// Constructors
export const meters = (value: number): Meters => ({_tag: "Meters", value});
export const seconds = (value: number): Seconds => ({_tag: "Seconds", value});
export const metersPerSecond = (value: number): MetersPerSecond => ({_tag: "MetersPerSecond", value});

// Converters
export const toMiles = (m: Meters): Miles => ({
  _tag: "Miles",
  value: m.value * 0.000621371192
});

export const toFeet = (m: Meters): Feet => ({
  _tag: "Feet",
  value: m.value * 3.2808399
});

export const toMilesPerHour = (ms: MetersPerSecond): Speed => ({
  _tag: "MilesPerHour", 
  value: ms.value * 2.237
});

export const toPace = (ms: MetersPerSecond): Speed => ({
  _tag: "Pace",
  value: pipe(
    seconds((26.8224 / ms.value) * 60), // minutes per mile
    getTime
  )
});

export const getTime = (s: Seconds): Time => ({
  seconds: Math.floor(s.value % 60),
  minutes: Math.floor((s.value / 60) % 60),
  hours: Math.floor(s.value / 3600)
});

// Formatting
const pad = (v: number) => v.toString().padStart(2, "0");

/**
 * Formats `seconds` into a friendly format such as "15m 32s"
 * Best used to describe elapsed time (hence the name)
 */
export const formatElapsed = (s: Seconds): string => {
  const t = getTime(s);

  if (t.hours > 0) 
    return format('{0}h {1}m')(t.hours, pad(t.minutes));

  if (t.minutes > 0) 
    return format('{0}m {1}s')(t.minutes, pad(t.seconds));

  return format('{0}s')(t.seconds);
};

/**
 * Formats speed properties for display
 */
export const formatSpeed = (s: Speed): string => {
  switch (s._tag) {
    case "Pace": 
      return (s.value.hours > 0) 
        ? format("{0}:{1}:{2}")
            (s.value.hours, pad(s.value.minutes), pad(s.value.seconds))
        : format("{0}:{1}")
            (s.value.minutes, pad(s.value.seconds));

    case "MilesPerHour": 
      return format("{0}mph")(Math.floor(s.value));

    default: 
      return "";
  }
}