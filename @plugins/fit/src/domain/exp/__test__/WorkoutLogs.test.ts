import WorkoutLogs from "../WorkoutLogs";
import WorkoutLog from "../WorkoutLog";
import ExperiencePoints from "../../user/ExperiencePoints";

let workout_logs: WorkoutLogs;
let workouts: WorkoutLog[];

const SMALL_EXP = ExperiencePoints.createFromSeconds(60, 0);
const MED_EXP = ExperiencePoints.createFromSeconds(600, 0);
const BIG_EXP = ExperiencePoints.createFromSeconds(6000, 0);

const USER_ID_WITH_SMALL_WORKOUT = "user1";
const USER_ID_WITH_BIG_WORKOUT = "user2";
const BIGGEST_WORKOUT_ID = "biggest_workout";

beforeAll(() => {
  workouts = [
    WorkoutLog.create(USER_ID_WITH_SMALL_WORKOUT, "a1", SMALL_EXP),
    WorkoutLog.create(USER_ID_WITH_BIG_WORKOUT, BIGGEST_WORKOUT_ID, BIG_EXP),
    WorkoutLog.create("id", "a2", MED_EXP)
  ];

  workout_logs = WorkoutLogs.createFromList(workouts);
})


describe("Workout Logs", () => {
  it("exposes the amount of workouts", () => {
    expect(workout_logs.count).toEqual(workouts.length)
  });


  it("returns workouts for a specific user", () => {
    const workouts = workout_logs.getWorkoutsFor(USER_ID_WITH_SMALL_WORKOUT);
    expect(workouts.count).toEqual(1);
    expect(workouts.totalExp).toEqual(SMALL_EXP.total);
  });


  it("combines total exp", () => {
    const sum = SMALL_EXP.total + MED_EXP.total + BIG_EXP.total;
    expect(workout_logs.totalExp).toEqual(sum);
  });


  it("exposes the workout with the most EXP", () => {
    const biggest = workout_logs.getBiggestWorkout();
    expect(biggest.activityId).toEqual(BIGGEST_WORKOUT_ID);
  });
})