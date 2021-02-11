import {Seconds, seconds} from "./Seconds";

export interface Meters {
  readonly value: number;
  miles(): number;
  feet(): number;
  pace(): Seconds;
  // mph(): number;
}

export const Meters = (value: number): Meters => ({
  get value() { return value; },

  miles() {
    return value * 0.000621371192;
  },

  feet() {
    return this.value * 3.2808399;
  },

  /** Returns a min/mi pace, as if this value is meters per second */
  pace() {
    return seconds((26.8224 / value)*60);
  }

  /** If this is a meters per second, this returns the miles per hour */
  // mph() {
  //   return new Meters(2.175 / this.value);
  // }
})