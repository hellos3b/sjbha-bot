import type * as User from "./User";
import { nanoid } from "nanoid";

type Schema__V0 = {
  discordId:    string;
  password:     string;
  stravaId:     number;
  refreshToken: string;
  gender:       string;
  maxHR:        number;
  xp:           number;
  fitScore:     number;
}

export type legacy = Schema__V0;

const v0 = (model: Schema__V0) : User.authorized => {
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const { password, ...user } = model;

   return {
      ...user,
      __version: 1,
      authToken: nanoid (),
      emojis:    model.gender === "M"
         ? "people-default"
         : "people-female",
   };
};

export const migrate = (model: User.user | legacy) : User.user => {
   if (!("__version" in model)) {
      return v0 (model);
   }

   return model;
};