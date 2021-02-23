import minimist from "minimist";
import {left, right, Either, fromNullable, mapLeft} from "fp-ts/Either";
import * as O from "fp-ts/Option";

import {InvalidArgsError, NotFoundError} from "@packages/common-errors";
import { pipe } from "fp-ts/lib/pipeable";

// TODO: Fill in error messages
export type Args = ReturnType<typeof Args>;
export function Args(message: string) {
  const parsed = minimist(message.split(" "));

  return {
    args: parsed, 

    length: parsed._.length,

    nth: (idx: number) => O.fromNullable(parsed._[idx]),

    nthE: (idx: number, onLeft: string) => pipe(
      parsed._[idx],
      fromNullable(InvalidArgsError.create(onLeft))
    ),

    get: (key: string): Either<NotFoundError, string> =>(!parsed[key])
      ? left(NotFoundError.create("Error!"))
      : right(parsed[key]),

    getNumber: (key: string): Either<NotFoundError | InvalidArgsError, number> =>
      (!parsed[key])
        ? left(NotFoundError.create("Error"))
        : castToNumber(parsed[key]),
  }
}

function castToNumber(value: any): Either<InvalidArgsError, number> {
  const val = parseInt(value);
  return (isNaN(val)) 
    ? left(InvalidArgsError.create(value + " is not a valid number"))
    : right(val);
}