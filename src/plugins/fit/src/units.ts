export interface Seconds {
  readonly value: number;
  friendlyString(): string;
  hhmmss(): string;
}

export const seconds = (value: number): Seconds => ({
  get value() { return value; },

  friendlyString() {
    const hours = Math.floor(value / (60 * 60));
    const divisor_for_minutes = value % (60 * 60);
    const minutes = Math.floor(divisor_for_minutes / 60);
    const divisor_for_seconds = divisor_for_minutes % 60;
    const seconds = Math.ceil(divisor_for_seconds);

    if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    return `${seconds}s`;
  },

  hhmmss() {
    let secs = value;
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
    return result;
  }
});

export interface Meters {
  readonly value: number;
  miles(): number;
  feet(): number;
  pace(): Seconds;
  // mph(): number;
}

export const meters = (value: number): Meters => ({
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