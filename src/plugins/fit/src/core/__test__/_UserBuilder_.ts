import * as O from "fp-ts/Option";
import {FitUser} from "../User";
import * as hr from "../Heartrate";
import * as p from "../Exp";

const base: FitUser = {
  _tag: "FitUser",
  id: "user1",
  // auth: {
  //   discordId: "some-id",
  //   password: "some-pass",
  //   stravaId: "",
  //   refreshToken: ""
  // },
  gender: "",
  zones: O.none,
  exp: p.exp(0),
  score: p.fitScore(0)
};

export default function UserBuilder(props = base) {
  const extend = (newProps: Partial<FitUser>) => UserBuilder({...props, ...newProps});

  return {
    withMaxHR(max: number) {
      return extend({
        zones: O.some(hr.zones(max))
      });
    },

    withExp(value: number) {
      return extend({
        exp: p.exp(value)
      });
    },

    withScore(value: number) {
      return extend({
        score: p.fitScore(value)
      });
    },

    build() {
      return props;
    }
  }
};