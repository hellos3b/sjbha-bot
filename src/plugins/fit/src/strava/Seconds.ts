export interface Seconds {
  readonly _tag: "seconds";
  readonly value: number;
}

export interface Time {
  readonly seconds: number;
  readonly minutes: number;
  readonly hours: number;
}

export const seconds = (value: number): Seconds => ({
  _tag: "seconds",
  value
});

export const toTime = (s: Seconds): Time => ({
  seconds: s.value%60,
  minutes: (s.value / 60) % 60,
  hours: s.value/3600
})

const fl = Math.floor;
const pad = (v: number) => fl(v).toString().padStart(2, "0");

/**
 * Formats `seconds` into a friendly format such as "15m 32s"
 * Best used to describe elapsed time (hence the name)
 */
export const elapsed = (s: Seconds): string => {
  const t = toTime(s);

  if (t.hours > 0) return `${fl(t.hours)}h ${pad(t.minutes)}m`;
  if (t.minutes > 0) return `${fl(t.minutes)}m ${pad(t.seconds)}s`;
  return `${fl(t.seconds)}s`;
};

/**
 * Converts seconds into hh:mm:ss format
 * Most useful for displaying a pace, such as how fast you ran
 */
export const hhmmss = (s: Seconds): string => {
  const t = toTime(s);

  return (t.hours > 0) 
    ? fl(t.hours) + ":" + pad(t.minutes) + ":" + pad(t.seconds)
    : fl(t.minutes) + ":" + pad(t.seconds);
};