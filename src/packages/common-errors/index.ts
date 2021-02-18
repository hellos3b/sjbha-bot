import { PathReporter } from 'io-ts/PathReporter';
import * as E from "fp-ts/Either";
import {AxiosError} from "axios";

/**
 * A resource was requested, but was unable to be found.
 */
export class NotFoundError extends Error {
  public type = "NotFound";
  public details: any;

  private constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }

  public static create(message: string, details?: any) {
    return new NotFoundError(message, details);
  }

  public static lazy(message: string, details?: any) {
    return () => new NotFoundError(message);
  }
}

/**
 * User does not have permissions to access a resource
 */
export class UnauthorizedError extends Error {
  public type = "Unauthorized";
  public details: any;

  private constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

/**
 * An unexpected error happened when accessing mongo DB
 */
export class MongoDbError extends Error {
  public type = "MongoDbError";
  public details: any;

  private constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }

  public static fromError(err: any) {
    if (err instanceof Error) return new MongoDbError(err.message, err);
    return new MongoDbError("Unexpected");
  }
}

/**
 * 
 */
export class InvalidArgsError extends Error {
  public readonly type = "InvalidArgs";
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }

  // todo: allow adding custom data
  public static create(message: string, key?: string, expected?: string, ) {
    return new InvalidArgsError(message);
  }
}

/**
 * When trying to access a resource over HTTP
 * and the url returned something other than a 2xx
 */
export class HTTPError extends Error {
  public type = "HTTPError";
  public url = "";
  public method?: string;
  public code?: string;
  public response: object = {};

  private constructor(message: string) {
    super(message);
  }

  public withMessage(msg: string) {
    this.message = msg + ": " + this.message;
    return this;
  }

  public static fromError(err: any) {
    const isAxiosError = (err: any): err is AxiosError => !!err.response;

    if (isAxiosError(err)) {
      const error = new HTTPError(err.message);
      error.url = (err.config.baseURL || "") + err.config.url;
      error.method = err.config.method;
      error.code = err.code;
      error.response = err.response?.data;
      return error;
    };

    if (err instanceof Error) return new HTTPError(err.message);

    return new HTTPError("");
  }
};

/**
 * When using io-ts to verify the shape of an IO object and the json doesn't match
 */
export class DecodeError extends Error {
  public type = "DecodeError";
  public details: any;

  private constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }

  public static fromError(err: any) {
    if (Array.isArray(err)) {
      const report = PathReporter.report(E.left(err));
      return new DecodeError("Decode failed", report);
    }

    // todo: parse error from io-ts decode error
    if (err instanceof Error) return new DecodeError(err.message, err);

    return new DecodeError("", err);
  }  
}

/**
 * This lets you gracefully convert an error in an `E.left` to a reply you can send to the user
 * Any errors that don't match will stay in the left, and should be passed on to an error reporter
 * 
 * ```ts
 * pipe(
 *   someEither,
 *   Error.match([
 *     [Errors.Unauthorized, "You are not authorized!"]
 *   ])
 * )
 * ```
 */

type ErrorClass<T> = Function & { prototype: T }
type ResolveTuple<E, T> = [ErrorClass<E>, (e: E) => T];
export const match = <E extends Error, T>(patterns: ResolveTuple<Error, T>[]) => {
  return (err: E): E.Either<E, T> => {
    const resolve = patterns.find(pattern => pattern[0].prototype.constructor === err.constructor);

    return (!resolve) 
      ? E.left(err) 
      : E.right(resolve[1](err));
  };
}