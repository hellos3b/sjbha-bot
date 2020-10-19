import * as R from "ramda";

// todo: Move this into a shared FP file
export const average = (values: number[]) => values.length ? R.sum (values) / values.length : 0;

export const filter = <T>(fn: (arg: T)=>boolean) => (values: T[]) => values.filter(fn);