import {weekly_exp_goal} from "../../../../config";
import WeeklyProgress, { ProgressReport, PromotionType } from "../WeeklyProgress";

import User from "../../user/User";
import Profile from "../../user/Profile";
import Level from "../../user/Level";
import FitScore from "../../user/FitScore";

import WorkoutLog from "../WorkoutLog";
import WorkoutLogs from "../WorkoutLogs";
import ExperiencePoints from "../../user/ExperiencePoints";

let weekly_progress: WeeklyProgress;
let workouts: WorkoutLogs;
let users: User[];

const USER_NEAR_PROMOTION_ID = "promo";
const USER_NEAR_DEMOTION_ID = "demo";
const BIGGEST_WORKOUT_ID = "biggest";

// We only care about fitscore and ID in this file
const createTestUser = (id: string, fitScore: number) => {
  return User.create(id, Profile.create("M"), Level.create(0, 0), FitScore.create(fitScore));
}

beforeEach(() => {
  users = [
    createTestUser(USER_NEAR_PROMOTION_ID, 58),
    createTestUser(USER_NEAR_DEMOTION_ID, 21)
  ];

  workouts = WorkoutLogs.createFromList([
    WorkoutLog.create(USER_NEAR_PROMOTION_ID, BIGGEST_WORKOUT_ID, ExperiencePoints.create(weekly_exp_goal)),
    WorkoutLog.create(USER_NEAR_DEMOTION_ID, "a2", ExperiencePoints.create(weekly_exp_goal / 4))
  ]);

  weekly_progress = WeeklyProgress.create(users, workouts);
});


describe("Weekly Progress", () => {
  let progress: ProgressReport;

  beforeEach(() => {
    weekly_progress.applyPromotions();
    progress = weekly_progress.getProgressReport();
  })


  describe("Progress Report", () => {
    it("has list of users", () => {
      expect(progress.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({discordId: USER_NEAR_DEMOTION_ID}),
          expect.objectContaining({discordId: USER_NEAR_PROMOTION_ID}),
        ])
      )
    });

    it("has activity count", () => 
      expect(progress.activityCount).toEqual(workouts.count)
    );
  });


  describe("Promotions", () => {
    it("returns all users", () => {
      expect(progress.promotions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({discordId: USER_NEAR_DEMOTION_ID}),
          expect.objectContaining({discordId: USER_NEAR_PROMOTION_ID}),
        ])        
      )
    });


    it("promoted and demoted users", () => {
      const promoted = progress.promotions.find(u => u.discordId === USER_NEAR_PROMOTION_ID);
      const demoted = progress.promotions.find(u => u.discordId === USER_NEAR_DEMOTION_ID);

      if (!promoted || !demoted) {
        throw new Error("Promoted or Demoted user missing")
      }

      expect(promoted.type).toEqual(PromotionType.PROMOTED);
      expect(demoted.type).toEqual(PromotionType.DEMOTED);
    });


    it("Only lets you promote once", () => {
      const second_promotion = () => weekly_progress.applyPromotions();
      expect(second_promotion).toThrow();
    });
  });


  describe("Leaderboard", () => {
    it("returns all users", () => {
      expect(progress.leaderboard).toEqual(
        expect.arrayContaining([
          expect.objectContaining({discordId: USER_NEAR_DEMOTION_ID}),
          expect.objectContaining({discordId: USER_NEAR_PROMOTION_ID}),
        ])        
      )
    })


    it("returns users sorted from most EXP to least", () => {
      const [first, second] = progress.leaderboard;
      expect(first.exp).toBeGreaterThan(second.exp);
    });
  });


  describe("Biggest Activity", () => {
    let biggest: WorkoutLog;

    beforeEach(() => {
      biggest = weekly_progress.getBiggestActivity();
    })

    it("returns the activity with most EXP", () => {
      expect(biggest).toEqual(
        expect.objectContaining({
          discordId: USER_NEAR_PROMOTION_ID,
          activityId: BIGGEST_WORKOUT_ID
        })
      );
    });
  });
})