import '@relmify/jest-fp-ts';
import {pipe} from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import {fromDatabase} from "../User";
import UserBuilder from "./_UserBuilder";
import WorkoutBuilder from './_WorkoutBuilder';

import {logWorkout} from "../User";
import * as hr from "../Heartrate";
import * as db from "../../io/__mock__/user_rows";

describe("User", () => {
  describe("Mapping", () => {
    it("returns left if db user isn't authorized", () => {
      const user = fromDatabase(db.user_not_authorized);
      expect(user).toBeLeft();
    });

    it("returns right if db user is authorized", () => {
      const user = fromDatabase(db.user_authorized);
      expect(user).toBeRight();
    });
  });

  describe("Adding a Workout", () => {
    const authedUser = UserBuilder().authorized();

    it("1exp/min when there is no heartrate", () => {
      const user = authedUser.build();
      const workout = WorkoutBuilder()
        .setDuration(100)
        .build();

      const result = logWorkout(workout)(user);

      expect(result.exp.value).toEqual(100);
    });

    it("1exp/min when user has no max heartrate", () => {
      const user = authedUser.build();
      const workout = WorkoutBuilder()
        .setDuration(100)
        .withHR(160, 160)
        .addHRSample(140, 100)
        .build();

      const result = logWorkout(workout)(user);

      expect(result.exp).toEqual(100);
    });

    it("uses HR zones to calculate XP", () => {
      const zones = hr.zones(200);
      
      const user = authedUser
        .withMaxHR(zones.max)
        .build();

      const workout = WorkoutBuilder()
        .withHR(160, 160)
        .addHRSample(zones.moderate - 1, 30)
        .addHRSample(zones.moderate + 1, 60)
        .addHRSample(zones.vigorous + 1, 90)
        .build();

      const result = logWorkout(workout)(user);

      expect(result.exp).toEqual(60 + (90 * 2));
    });
  });
});