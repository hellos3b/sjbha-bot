import {User} from "../user-db";

const base: User = {
  discordId: "bob",
  password: "password",
  stravaId: "",
  refreshToken: "",
  gender: "",
  maxHR: 0,
  xp: 0,
  fitScore: 0
}; 

const extend = (json: Partial<User>): User => 
  Object.assign({}, base, json);

export const user_not_authorized = extend({
  refreshToken: ""
});

export const user_authorized = extend({
  stravaId: "some-id",
  refreshToken: "some-token"
});