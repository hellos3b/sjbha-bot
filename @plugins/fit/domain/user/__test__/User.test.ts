import User, { SerializedUser } from "../User";
import Profile from "../Profile";
import Level from "../Level";
import FitScore from "../FitScore";
import ExperiencePoints from "../ExperiencePoints";

import {points_per_goal, weekly_exp_goal} from "../../../config";
import * as Activity from "../../strava/__test__/createActivity";


let user: User;
let initial_user: SerializedUser;

// Initial settings for user
const GENDER = "M";
const EXP = 100;
const HR = 200;
const FIT_SCORE = 18;

beforeEach(() => {
  user = User.create(
    "discord-id",
    Profile.create(GENDER),
    Level.create(EXP, HR),
    FitScore.create(FIT_SCORE)
  );
  initial_user = Object.freeze(user.serialize());
})


describe("User", () => {
  it("serializes", () => {
    expect(initial_user.gender).toEqual(GENDER);
    expect(initial_user.exp).toEqual(EXP);
    expect(initial_user.maxHR).toEqual(HR);
    expect(initial_user.fitScore).toEqual(FIT_SCORE)
  })


  describe("Gender", () => {
    it("updates gender", () => {
      user.updateGender("F");
      expect(user.serialize().gender).toEqual("F");
    });


    it("doesnt set an unknown gender", () => {
      const gender_doesnt_exist = () => user.updateGender("Z");
      expect(gender_doesnt_exist).toThrow();
    });
  });


  describe("Heartrate", () => {
    it("updates max heart rate", () => {
      user.updateMaxHeatrate(180);
      expect(user.serialize().maxHR).toEqual(180);
    });


    it("lets you set to 0 to disable HR", () => {
      user.updateMaxHeatrate(0);
      expect(user.serialize().maxHR).toEqual(0);
    });


    it("errors when HR is set out of zone", () => {
      const hrTooHigh = () => user.updateMaxHeatrate(300);
      const hrTooLow = () => user.updateMaxHeatrate(20);

      expect(hrTooHigh).toThrow();
      expect(hrTooLow).toThrow();
    });
  })


  describe("Leveling", () => {
    let prevExp: number;
    
    beforeEach(() => prevExp = initial_user.exp);

    it("adds EXP to the user when you add an activity", () => {
      const ELAPSED_TIME = 120;
      const activity = Activity.createWithElapsedTime(ELAPSED_TIME);
      
      // run
      const exp = user.addActivity(activity);

      // check
      const newExp = user.serialize().exp;
      const diff = newExp - prevExp;

      expect(exp.total).toEqual(diff);
    });


    it("it uses elapsed time to calculate exp", () => {
      const ELAPSED_TIME = 120;
      const expected_exp = ExperiencePoints.createFromSeconds(ELAPSED_TIME, 0);
      const activity = Activity.createWithElapsedTime(ELAPSED_TIME);
      
      // run
      const exp = user.addActivity(activity);

      expect(exp.total).toEqual(expected_exp.total);
    });


    it("uses elapsed time if heartrate is zero", () => {
      const TIME_IN_MODERATE = 120;
      const TIME_IN_VIGOROUS = 120;

      const expected_exp = ExperiencePoints.createFromSeconds(TIME_IN_MODERATE + TIME_IN_VIGOROUS, 0);
      const activity = Activity.createWithStreams(initial_user.maxHR, TIME_IN_MODERATE, TIME_IN_VIGOROUS);
      
      user.updateMaxHeatrate(0);
      const exp = user.addActivity(activity);

      expect(exp.total).toEqual(expected_exp.total);
    });


    it("uses time if activity has no HR stream", () => {
      const ELAPSED_TIME = 120;
      const activity = Activity.createWithElapsedTime(ELAPSED_TIME);
      const expected_exp = ExperiencePoints.createFromSeconds(ELAPSED_TIME, 0);
      
      // run
      const exp = user.addActivity(activity);

      expect(exp.total).toEqual(expected_exp.total);
    });


    it("uses HR Streams if exist", () => {
      const TIME_IN_MODERATE = 120;
      const TIME_IN_VIGOROUS = 160;

      const activity = Activity.createWithStreams(initial_user.maxHR, TIME_IN_MODERATE, TIME_IN_VIGOROUS);
      const expected_exp = ExperiencePoints.createFromSeconds(TIME_IN_MODERATE, TIME_IN_VIGOROUS);
      
      // run
      const exp = user.addActivity(activity);

      expect(exp.total).toEqual(expected_exp.total);
    });
  });
  

  describe("Fit Score", () => {
    const PT_PER_GOAL = points_per_goal;
    const EXP_GOAL = weekly_exp_goal;

    const expectDiff = () => expect(user.serialize().fitScore - initial_user.fitScore);

    it("increases when goal is met", () => {
      user.updateFitScore(EXP_GOAL);
      expectDiff().toEqual(PT_PER_GOAL);
    });

    
    it("decreases fully when no workouts", () => {
      user.updateFitScore(0);
      expectDiff().toEqual(-PT_PER_GOAL);
    });


    it("decreases partially when only slightly miss goal", () => {
      user.updateFitScore(EXP_GOAL / 2);
      expectDiff().toBeLessThan(0);
      expectDiff().toBeGreaterThan(-PT_PER_GOAL);
    });


    it("doesn't dip below 0", () => {
      const fit_score = FitScore.create(0);
      fit_score.updateFitScore(0);
      expect(fit_score.value).toEqual(0);
    });


    it("doesn't go above 100", () => {
      const fit_score = FitScore.create(100);
      fit_score.updateFitScore(EXP_GOAL);
      expect(fit_score.value).toEqual(100);
    });
  });
})