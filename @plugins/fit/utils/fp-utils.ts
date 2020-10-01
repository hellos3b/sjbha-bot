import {prop as RProp, pipe, defaultTo, sort, negate} from "ramda";

// Additional FP functions I find help out when working with Ramda
// especially with typings in Typescript

/** Apply an array of arguments onto a method, but curried */
export const apply = <T extends (...args: any[])=>any>(fn: T) => (data: Parameters<T>): ReturnType<T> => fn.apply(null, data);

/** Get the prop of the object. `<T>` can be explicitely set to define return value */
export const prop = <T>(key: string) => (obj: Record<string, any>): T => obj[key];

/** Get or Else of props. `<T>` can be explicitly set to define return value */
export const propOr = <T>(key: string, defaultVal: T) => pipe(prop<T>(key), defaultTo(defaultVal));

/** Looks up a hash table */
export const switchcase = <T>(lookupObj: Record<string, T>) => (key: string): T => RProp(key, lookupObj);

/** Filters null values out of an array. `reject(isNil)` isn't typed well enough */
export const filterNil = <T>(arr: (T|null)[]) => arr.filter((value): value is T => !!value);

/** Sort an array of objects by a prop */
export const sortByProp = <T extends Record<string, any>>(propName: keyof T, descend = -1) => 
  sort((a: T, b: T) => a[propName] > b[propName] ? negate(descend) : descend);