import type { DateTime } from "luxon";
import format from 'string-format';
import fromNow from "fromnow";
import {multiply, pipe} from "ramda";

/** Format a number to the first decimal place `(1.423 => 1.4)` */
export const toTenths = (value: number) => value.toFixed(1);

/** Converts meters to miles */
export const toMiles = (meters: number) => pipe(
  multiply(0.000621371192),
  toTenths,
  val => val + 'mi'
)(meters)

/** Converts meters to a pace mm:ss/mi */
export const toPace = (seconds: number) => {
  let secs = seconds;

  let minutes = Math.floor(secs / 60);
  secs = Math.floor(secs%60);

  let hours = Math.floor(minutes/60)
  minutes = minutes%60;

  let result = "";
  if (hours > 0) {
    result += hours+":";
    result += minutes.toString().padStart(2, "0");
  } else {
    result += minutes.toString()
  }

  result += ":" + secs.toString().padStart(2, "0");
  return result + "/mi";
}

/** Converts seconds to a time string, example "43m 20s" */
export const toTime = (seconds: number) => {
  const hours = Math.floor(seconds / (60 * 60));

  const divisor_for_minutes = seconds % (60 * 60);
  const minutes = Math.floor(divisor_for_minutes / 60);

  const divisor_for_seconds = divisor_for_minutes % 60;
  const sec = Math.ceil(divisor_for_seconds);

  if (hours > 0) {
    return format('{1}h {2}m', [hours, pad(minutes)]);
  }

  if (minutes > 0) {
    return format('{1}m {2}s', [minutes, pad(sec)]);
  }

  return `${sec}s`;
}

/** Turn a luxon dateTime into a "from now" time */
export const toRelative = (time: DateTime) => fromNow(time.toString(), {suffix: true, max: 1})

const pad = (value: number) => value.toString().padStart(2, "0");