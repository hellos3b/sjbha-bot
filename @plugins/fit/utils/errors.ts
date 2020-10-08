import { Maybe } from "purify-ts";

export interface ErrorT {
  type: string;
  message: Maybe<string>;
}

export const error = (type: string) => (message?: string): ErrorT => ({
  type, 
  message: Maybe.fromNullable(message)
})

/** When parsing IO and the schema doesn't match */
export const RUNTYPE_FAILURE = "Runtype Failure";
/** When the user hasn't connected their strava account yet */
export const HASNT_AUTHORIZED = "Hasn't Authorized";
/** Trying to preform an authorized request but id/password combo is incorrect */
export const INVALID_CREDENTIALS = "Invalid Credentials";
/** When you have no idea what happened */
export const UNEXPECTED = "Unexpected";




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