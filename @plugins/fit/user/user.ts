import type {AuthorizedUser} from "./collection";

import * as R from "ramda";

export const setGender = (gender: string) => (user: AuthorizedUser): AuthorizedUser => ({
  ...user, gender
});