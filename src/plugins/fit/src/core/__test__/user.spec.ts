import '@relmify/jest-fp-ts';
import {constant, pipe} from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import {fromDatabase} from "../User";
import UserBuilder from "./_UserBuilder_";
import WorkoutBuilder from './_WorkoutBuilder_';

import {FitUser, logWorkout} from "../User";
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

    it("honors HR privacy when it's set to 0", () => {
      const user = pipe(
        fromDatabase(db.user_authorized),
        E.getOrElseW(() => {throw new Error('User mapped to ')})
      )

      expect(user.zones).toBeNone();
    });

    it("initializes user HR zones when HR != 0", () => {
      const user = pipe(
        fromDatabase(db.user_with_max_hr(200)),
        E.getOrElseW(() => {throw new Error('User mapped to ')})
      )

      expect(user.zones).toBeSome();
    })
  });

  describe("Adding a Workout", () => {
    it("1exp/min when there is no heartrate", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .build();

      const [, exp] = logWorkout(workout)(user);

      expect(exp.value).toEqual(100);
    });

    it("1exp/min when user has no max heartrate", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .withHR(160, 160)
        .addHRSample(140, 100)
        .build();

      const [,exp] = logWorkout(workout)(user);

      expect(exp.value).toEqual(100);
    });

    it("uses HR zones to calculate XP", () => {
      const zones = hr.zones(200);
      
      const user = UserBuilder()
        .withMaxHR(zones.max)
        .build();

      const workout = WorkoutBuilder()
        .withHR(160, 160)
        .addHRSample(zones.moderate - 1, 30)
        .addHRSample(zones.moderate + 1, 60)
        .addHRSample(zones.vigorous + 1, 90)
        .build();

      const [,exp] = logWorkout(workout)(user);

      expect(exp.value).toEqual(60 + (90 * 2));
    });

    it("user's exp gets updated", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .build();

      const [u] = logWorkout(workout)(user);

      expect(u.exp.value).toEqual(100);      
    })
  });
});