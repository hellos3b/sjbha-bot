import minimist from "minimist";
import {left, right, Either} from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as t from "io-ts";

import {DecodeError, NotFound} from "@packages/common-errors";

// TODO: Fill in error messages
export type Args = Object & {
  nth(idx: number): O.Option<string>;
  get(key: string): O.Option<string>;
  getNumber(key: string): Either<Error, number>;
}

export function Args(message: string): Args {
  const parsed = minimist(message.split(" "));

  return {
    nth: idx => O.fromNullable(parsed._[idx]),
    get: key => O.fromNullable(parsed[key]),
    getNumber: key => (!parsed[key])
      ? left(NotFound.create("Error"))
      : castToNumber(parsed[key]),
    toString() {
      return JSON.stringify(parsed)
    }
  }
}

function castToNumber(value: any): Either<Error, number> {
  const val = parseInt(value);
  return (isNaN(val)) 
    ? left(DecodeError.create(value + " is not a valid number"))
    : right(val);
}