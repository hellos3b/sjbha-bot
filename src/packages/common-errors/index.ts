import {AxiosError} from "axios";

export abstract class CustomError extends Error {
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }

  public static create<T extends CustomError>(this: {new(...args: any[]): T}, message: string, details?: any) {
     return new this(message, details);
  }

  public static lazy<T extends CustomError>(this: {new(...args: any[]): T}, message: string) {
    return () => new this(message);
  }

  public static fromError<T extends CustomError>(this: {new(...args: any[]): T}, error: any) {
    if (error instanceof Error) return new this(error.message, error);
    return new this("");
  }
}

// Common Helpers
export class NotFound extends CustomError {}
export class DecodeError extends CustomError {}
export class Unauthorized extends CustomError {}
export class MongoDbError extends CustomError {}
export class HTTPError extends CustomError {
  public static fromError<T extends CustomError>(this: {new(...args: any[]): T}, err: any) {
    const isAxiosError = (err: any): err is AxiosError => !!err.response;

    if (isAxiosError(err)) return new this(err.message, {
      url: (err.config.baseURL || "") + err.config.url,
      method: err.config.method,
      code: err.code,
      response: err.response?.data
    });

    if (err instanceof Error) return new this(err.message, err);

    return new this("");
  }
};