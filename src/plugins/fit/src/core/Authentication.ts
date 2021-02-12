import * as db from "../io/user-db";

export type Authentication = {
  readonly discordId: string;
  readonly password: string;
  readonly stravaId: string;
  readonly refreshToken: string;
}

export const auth = (user: db.User) => ({
  discordId: user.discordId,
  password: user.password,
  stravaId: user.stravaId,
  refreshToken: user.refreshToken
});