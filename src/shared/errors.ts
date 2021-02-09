import { Maybe } from "purify-ts";

export interface ErrorT {
  readonly type: string;
  readonly message: Maybe<string>;
  is(type: string): boolean;
}

export const NOT_FOUND = "Not Found";
export const DECODE_ERROR = "Decode Error";
export const UNAUTHORIZED = "Unauthorized";
export const MONGODB_ERROR = "MongoDB Error";
export const HTTP_ERROR = "HTTP Error";
export const UNEXPECTED = "Unexpected";

export const error = (type: string) => (message?: string): ErrorT => ({
  type, 
  message: Maybe.fromNullable(message),
  is: t => t === type
})

export const notFound = error(NOT_FOUND);
export const decodeError = error(DECODE_ERROR);
export const unauthorized = error(UNAUTHORIZED);
export const mongoDbError = error(MONGODB_ERROR);
export const httpError = error(HTTP_ERROR);
export const unexpected = (err?: any) => {
  console.error("Unexpected error: ", err);
  return error(UNEXPECTED)(err.message);
};