import * as R from "ramda";
import {Maybe} from "purify-ts";

// Additional FP functions I find help out when working with Ramda
// especially with typings in Typescript

/** Apply an array of arguments onto a method, but curried */
export const apply = <T extends (...args: any[])=>any>(fn: T) => (data: Parameters<T>): ReturnType<T> => fn.apply(null, data);

/** Get the prop of the object. `<T>` can be explicitely set to define return value */
export const prop = <T>(key: string) => (obj: Record<string, any>): T => obj[key];

/** Get or Else of props. `<T>` can be explicitly set to define return value */
export const propOr = <T>(key: string, defaultVal: T) => R.pipe(prop<T>(key), R.defaultTo(defaultVal));

/** Looks up a hash table */
export const switchcase = <T>(lookupObj: Record<string|number, T>) => (key: string|number): T => R.prop(key, lookupObj);

/** Filters null values out of an array. `reject(isNil)` isn't typed well enough */
export const filterNil = <T>(arr: (T|null)[]) => arr.filter((value): value is T => !!value);

/** Sort an array of objects by a prop */
export const sortByProp = <T extends Record<string, any>>(propName: keyof T, descend = -1) => 
  R.sort((a: T, b: T) => a[propName] > b[propName] ? R.negate(descend) : descend);

/** Checks if a value is Falsy */
export const falsy = <T>(val: T): boolean => !!val;

/** Checks if an array has items */
export const isEmpty = <T>(val: T[]): boolean => !val.length;

/** A better typed version of `R.ifElse` */
export const ifElse = <T, U>(ifCond: (val: T)=>boolean) => (
  isTrue: (val?: T)=>U,
  isFalse: (val?: T)=>U
) => (val: T) => ifCond(val) ? isTrue(val) : isFalse(val);

/** Wraps `R.last` in a maybe to account for undefined. Also typed a little more smooth */
export const last = <T>(arr: T[]): Maybe<T> => Maybe.fromNullable (R.last (arr));

export const mapIdx = <T, U>(fn: (a: T, b: number)=>U) => (arr: T[]) => arr.map(fn);