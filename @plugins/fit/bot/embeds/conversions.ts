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
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${sec.toString().padStart(2, "0")}s`;
  }

  return `${sec}s`;
}