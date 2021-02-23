import axios, {AxiosRequestConfig} from "axios";
import * as TE from "fp-ts/TaskEither";
import {ReaderTaskEither} from "fp-ts/ReaderTaskEither";
import {HTTPError} from "@packages/common-errors";

/**
 * Wraps a custom AxiosInstance with method calls that auto-lift to an `EitherAsync`
 * or throws an `HTTP_ERROR`
 */
export function Client(config: AxiosRequestConfig = {}) {
  return axios.create({
    ...config,
    headers: {
      ...(config.headers || {}),
      "Content-Type": "application/json"
    }
  });
}

export const get = <R>(url: string, params: object = {}): ReaderTaskEither<Client, HTTPError, R> => {
  return (c: Client) => TE.tryCatch(
    () => c.get<R>(url, {params}).then(_ => _.data),
    HTTPError.fromError
  );
}

export const post = <R>(url: string, data: object = {}): ReaderTaskEither<Client, HTTPError, R> => {
  return (c: Client) => TE.tryCatch(
    () => c.post<R>(url, data).then(_ => _.data),
    HTTPError.fromError
  );
}

export type Client = ReturnType<typeof Client>;