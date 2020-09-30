export interface TError {
  name: string;
}

export const NotAuthorized = (): TError => ({
  name: "Not Authorized"
});

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