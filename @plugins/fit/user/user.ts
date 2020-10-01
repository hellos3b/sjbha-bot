import type {AuthorizedUser} from "./collection";

import * as R from "ramda";

export const setStravaAuth = (stravaId: number, refreshToken: string) => (user: AuthorizedUser): AuthorizedUser => ({
  ...user,
  stravaId: String(stravaId),
  refreshToken
})

export const setGender = (gender: string) => (user: AuthorizedUser): AuthorizedUser => ({
  ...user, gender
});