import '@relmify/jest-fp-ts';
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";
import UserBuilder from "./_UserBuilder_";
import WorkoutBuilder from './_WorkoutBuilder_';

import {fromDatabase, addWorkout, promote, isAuthorized, asAuthorized} from "../User";
import * as hr from "../Heartrate";
import * as xp from "../Exp";
import * as db from "../../io/__mock__/user_rows";

const member = {
  id: "member-id",
  name: "user",
  avatar: "pic.jpg"
};

describe("User", () => {
  describe("Mapping", () => {
    /** Folds a `User` to a `FitUser`, otherwise throws */
    const throwIfUnauthorized = flow(asAuthorized, E.getOrElseW(() => {throw new Error("Expected user to be authorized")}));

    it("returns left if db user isn't authorized", () => {
      const user = fromDatabase(db.user_not_authorized)(member);
      expect(isAuthorized(user)).toBeFalsy();
    });

    it("returns right if db user is authorized", () => {
      const user = fromDatabase(db.user_authorized)(member);
      expect(isAuthorized(user)).toBeTruthy();
    });

    it("honors HR privacy when it's set to 0", () => {
      const user = pipe(
        fromDatabase(db.user_authorized)(member),
        throwIfUnauthorized
      );
        
      expect(user.zones).toBeNone();
    });

    it("initializes user HR zones when HR != 0", () => {
      const user = pipe(
        fromDatabase(db.user_with_max_hr(200))(member),
        throwIfUnauthorized
      );

      expect(user.zones).toBeSome();
    });
  });

  describe("Adding a Workout", () => {
    it("1exp/min when there is no heartrate", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .build();

      const [, exp] = addWorkout(user)(workout);

      expect(exp.value).toBeCloseTo(100 / 60);
    });

    it("1exp/min when user has no max heartrate", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .withHR(160, 160)
        .addHRSample(140, 100)
        .build();

      const [,exp] = addWorkout(user)(workout);

      expect(exp.value).toBeCloseTo(100 / 60);
    });

    it("uses HR zones to calculate XP", () => {
      const zones = hr.zones(200);
      const moderate_minutes = 10;
      const vigorous_minutes = 5;
      
      const user = UserBuilder()
        .withMaxHR(zones.max)
        .build();

      const workout = WorkoutBuilder()
        .withHR(160, 160)
        .addHRSample(zones.moderate - 1, 160)
        .addHRSample(zones.moderate + 1, (moderate_minutes * 60))
        .addHRSample(zones.vigorous + 1, (vigorous_minutes * 60))
        .build();

      const [,exp] = addWorkout(user)(workout);

      expect(exp.value).toBeCloseTo(moderate_minutes + (vigorous_minutes * 2));
    });

    it("user's exp gets updated", () => {
      const user = UserBuilder()
        .build();

      const workout = WorkoutBuilder()
        .setDuration(100)
        .build();

      const [u] = addWorkout(user)(workout);

      expect(u.exp.value).toBeCloseTo(100 / 60);      
    })
  });

  describe("Weekly Progression", () => {
    it("raises fit score if you hit the min xp goal", () => {
      const half_of_goal = xp.weekly_exp_goal / 2;
      const week = [
        xp.exp(half_of_goal),
        xp.exp(half_of_goal),
        xp.exp(10)
      ];

      const user = UserBuilder().build();
      const result = promote(week)(user);

      expect(result.score.value).toEqual(5);
    });

    it("lowers fit score if you've recorded no activity", () => {
      const week: xp.EXP[] = [];

      const user = UserBuilder()
        .withScore(5)
        .build();

      const result = promote(week)(user);

      expect(result.score.value).toEqual(0);
    });

    it("fit score drops relative to missed exp goal", () => {
      const week = [
        xp.exp(xp.weekly_exp_goal / 3)
      ];

      const user = UserBuilder()
        .withScore(5)
        .build();

        const result = promote(week)(user);

        expect(result.score.value).toBeCloseTo(5 / 3);
    });

    it("score doesn't drop below zero", () => {
      const week: xp.EXP[] = [];

      const user = UserBuilder()
        .withScore(0)
        .build();

        const result = promote(week)(user);

        expect(result.score.value).toEqual(0);
    });

    it("score caps out at 100", () => {
      const week = [
        xp.exp(xp.weekly_exp_goal + 1)
      ];

      const user = UserBuilder()
        .withScore(100)
        .build();

      const result = promote(week)(user);

      expect(result.score.value).toEqual(100);
    })
  });
});