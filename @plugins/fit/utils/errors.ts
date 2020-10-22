import type {Request} from "@services/bastion";
import { Maybe } from "purify-ts";

import * as R from "ramda";
import * as FP from "./fp-utils";
import {debug} from "../config";

export interface ErrorT {
  type: string;
  message: Maybe<string>;
}

export const error = (type: string) => (message?: string): ErrorT => ({
  type, 
  message: Maybe.fromNullable(message)
})

export const unexpected = (message?: string) => (err: any): ErrorT => {
  debug("Unexpected error: %o", message);
  console.error(err);

  return {
    type: UNEXPECTED,
    message: Maybe.fromNullable(message)
  }
};

/** When parsing IO and the schema doesn't match */
export const RUNTYPE_FAILURE = "Runtype Failure";
/** When the user hasn't connected their strava account yet */
export const HASNT_AUTHORIZED = "Hasn't Authorized";
/** Trying to preform an authorized request but id/password combo is incorrect */
export const INVALID_CREDENTIALS = "Invalid Credentials";
/** When you have no idea what happened */
export const UNEXPECTED = "Unexpected";

export const getErrorMessage = (err: any) => FP.switchcase({
  [HASNT_AUTHORIZED]    : "You need to connect Strava to the bot first. Use `!fit auth` to get started",
  [RUNTYPE_FAILURE]     : "\//todo",
  [INVALID_CREDENTIALS] : "\//todo"
})

export const unknownMessage = R.pipe(
  R.tap (console.error),
  R.always (
    "An unexpected error just happened, which... shouldn't. *PSSST*, hey <@125829654421438464>, someone found a bug."
  )
)

export const handleError = (req: Request) => R.pipe(
  getErrorMessage,
  FP.defaultToLazy (unknownMessage),
  req.text
)


// DEPRECATED Vvvvvvvvv

/**
 * When a user tries to use the command but has never done `!strava auth`
 */
export class NotConnected extends Error {
  static type = "Not Connected";

  constructor(message: string) {
    super(message);
    this.name = NotConnected.type;
  }
}


/**
 * When trying to access a page that requires the password, but login is wrong
 */
export class Unauthorized extends Error {
  static type = "Unauthorized";

  constructor(message: string) {
    super(message);
    this.name = NotConnected.type;
  }
}