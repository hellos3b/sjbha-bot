import axios, {AxiosRequestConfig} from "axios";
import * as R from "ramda";
import * as TE from "fp-ts/TaskEither";
import {HTTPError} from "@packages/common/errors";

/**
 * Wraps a custom AxiosInstance with method calls that auto-lift to an `EitherAsync`
 * or throws an `HTTP_ERROR`
 */
export function AsyncClient(config: AxiosRequestConfig = {}) {
  const client = axios.create({
    ...config,
    headers: {
      ...(config.headers || {}),
      "Content-Type": "application/json"
    }
  });

  return {
    get: <R>(url: string, params: object = {}) => TE.tryCatch<Error, R>(
      () => client.get<R>(url, {params}).then(R.prop("data")),
      HTTPError.fromError
    ),

    post: <R>(url: string, data: object = {}) => TE.tryCatch<Error, R>(
      () => client.post<R>(url, data).then(R.prop("data")),
      HTTPError.fromError
    )
  }
}

export type AsyncClient = ReturnType<typeof AsyncClient>;