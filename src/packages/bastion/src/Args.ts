import minimist from "minimist";
import {Left, Maybe, Right, Either} from "purify-ts";
import {decodeError, ErrorT, notFound} from "@shared/errors";

export interface Args {
  nth(idx: number): Maybe<string>;
  get(key: string): Maybe<string>;
  getNumber(key: string): Either<ErrorT, number>;
}

export function Args(message: string): Args {
  const parsed = minimist(message.split(" "));

  return {
    nth: idx => Maybe.fromNullable(parsed._[idx]),
    get: key => Maybe.fromNullable(parsed[key]),
    getNumber: key => Maybe
      .fromNullable(parsed[key])
      .toEither(notFound())
      .chain(castToNumber)
  }
}

function castToNumber(value: any): Either<ErrorT, number> {
  const val = parseInt(value);
  return (isNaN(val)) 
    ? Left(decodeError(""))
    : Right(val);
}