import * as O from "fp-ts/Option";
import {FitUser} from "../User";
import * as auth from "../Authentication";
import * as hr from "../Heartrate";
import * as fs from "../FitScore";
import * as xp from "../Exp";

const base: FitUser = {
  _tag: "FitUser",
  auth: {
    discordId: "some-id",
    password: "some-pass",
    stravaId: "",
    refreshToken: ""
  },
  gender: "",
  zones: O.none,
  exp: {
    _tag: "EXP",
    value: 0
  },
  score: fs.score(0)
};

export default function UserBuilder(props = base) {
  const extend = (newProps: Partial<FitUser>) => UserBuilder({...props, ...newProps});

  return {
    authorized() {
      return extend({
        auth: {
          ...base.auth,
          stravaId: "some-id",
          refreshToken: "some-token"
        }
      });
    },

    withMaxHR(max: number) {
      return extend({
        zones: O.some(hr.zones(max))
      });
    },

    withExp(value: number) {
      return extend({
        exp: xp.exp(value)
      });
    },

    withScore(value: number) {
      return extend({
        score: fs.score(value)
      });
    },

    build() {
      return props;
    }
  }
};