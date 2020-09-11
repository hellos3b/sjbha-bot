import memoize from "memoizee";

import StravaClient from "./client";
import StravaAuthClient from "./oauth";
import UserCollection from "../db/UserCollection";
import { NotConnected } from "../errors";

interface Query {
  discordId?: string;
  stravaId?: string;
}

export const getStravaClient = memoize(async (query: Query) => {
  const user = await UserCollection().findOne(query);

  if (!user) {
    throw new NotConnected("Cannot get client")
  }

  const authClient = new StravaAuthClient();
  const accessToken = await authClient.getAccessToken(user.refreshToken);

  return new StravaClient(accessToken);
}, {maxAge: 60 * 60 * 5, promise: true});

export const getAuthInfo = async (code: string) => {
  const client = new StravaAuthClient()
  return client.getRefreshToken(code);
}

export type {ActivityResponse, ActivityStreamResponse} from "./types";