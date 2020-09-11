import Seconds from "./Seconds";

export default class Meters {
  constructor(
    public readonly value: number
  ) {}

  get toMiles() {
    return this.value * 0.000621371192;
  }

  get toFeet() {
    return this.value * 3.2808399;
  }

  /** Returns a min/mi pace, as if this value is meters per second */
  get toPace() {
    return new Seconds((26.8224 / this.value)*60);
  }

  /** If this is a meters per second, this returns the miles per hour */
  get toMPH() {
    return new Meters(2.175 / this.value);
  }
}