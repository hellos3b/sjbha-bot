import { PathReporter } from 'io-ts/PathReporter';
import * as E from "fp-ts/Either";
import {AxiosError} from "axios";
import { MessageOptions } from 'discord.js';

export class CustomError extends Error {
  public readonly details: any;

  constructor(name: string, message: string, details?: any) {
    super(message);
    this.name = name;
    this.details = details;
  }
}

export const error = (name: string) => ({
  name,

  create(message: string, details?: any): Error {
    return new CustomError(name, message, details);
  },

  lazy(message: string): () => Error {
    return () => new CustomError(name, message);
  },

  fromError(error: any): Error {
    if (error instanceof Error) return new CustomError(name, error.message, error);
    return new CustomError(name, "");
  }
});

// Common Helpers
export const NotFound = error("NotFound");
export const Unauthorized = error("Unauthorized");
export const MongoDbError = error("MongoDbError");
export const InvalidArgs = error("InvalidArgs");

export const HTTPError = {
  fromError(err: any): Error {
    const isAxiosError = (err: any): err is AxiosError => !!err.response;

    if (isAxiosError(err)) return new CustomError("HTTPError", err.message, {
      url: (err.config.baseURL || "") + err.config.url,
      method: err.config.method,
      code: err.code,
      response: err.response?.data
    });

    if (err instanceof Error) return new CustomError("HTTPError", err.message, err);

    return new CustomError("HTTPError", "");
  }
};

export const DecodeError = {
  create(message: string, details?: any): Error {
    return new CustomError("DecodeError", message, details);
  },

  fromError(err: any): Error {
    console.error("Decode Error", err);
    if (Array.isArray(err)) {
      const report = PathReporter.report(E.left(err));
      return new CustomError("DecodeError", "Decode failed", report);
    }
    // todo: parse error from io-ts decode error
    if (err instanceof Error) return new CustomError("DecodeError", err.message, err);
    return new CustomError("DecodeError", "", err);
  }  
};

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
export const match = (patterns: Array<[{name: string}, string]>) => {
  return E.orElse((err: Error): E.Either<Error, MessageOptions> => {
    const resolve = patterns.find(([p]) => p.name === err.name);
    return (!resolve) ? E.left(err) : E.right({content: resolve[1]});
  });
}