import {prop as RProp, pipe, defaultTo} from "ramda";

// Additional FP functions I find help out when working with Ramda
// especially with typings in Typescript

/** Get the prop of the object. `<T>` can be explicitely set to define return value */
export const prop = <T>(key: string) => (obj: Record<string, any>): T => obj[key];

/** Get or Else of props. `<T>` can be explicitly set to define return value */
export const propOr = <T>(key: string, defaultVal: T) => pipe(prop<T>(key), defaultTo(defaultVal));

/** Looks up a hash table */
export const switchcase = <T>(lookupObj: Record<string, T>) => (key: string): T => RProp(key, lookupObj);

/** Filters null values out of an array. `reject(isNil)` isn't typed well enough */
export const filterNil = <T>(arr: (T|null)[]) => arr.filter((value): value is T => !!value);