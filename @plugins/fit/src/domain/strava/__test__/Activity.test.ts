import {createWithStreams, createWithElapsedTime} from "./createActivity";

describe("Activity", () => {
  // This is more to ensure the test creation cases are good
  it("creates with elapsed time", () => {
    const SECONDS = 120;
    const activity = createWithElapsedTime(SECONDS);

    expect(activity.hasHeartrate).toBeFalsy();
    expect(activity.elapsedTime.value).toEqual(SECONDS);
  })

  it("gets effort with only moderate seconds", () => {
    const HR = 200;
    const TIME_IN_MODERATE = 120;

    const activity = createWithStreams(HR, TIME_IN_MODERATE, 0);
    const effort = activity.getEffort(HR);

    expect(effort.moderate).toEqual(TIME_IN_MODERATE);
  })

  it("gets effort with only vigorous seconds", () => {
    const HR = 200;
    const TIME_IN_VIGOROUS = 120;

    const activity = createWithStreams(HR, 0, TIME_IN_VIGOROUS);
    const effort = activity.getEffort(HR);

    expect(effort.vigorous).toEqual(TIME_IN_VIGOROUS);
  })  

  it("gets both moderate and vigorous effort", () => {
    const HR = 200;
    const TIME_IN_MODERATE = 160;
    const TIME_IN_VIGOROUS = 120;

    const activity = createWithStreams(HR, TIME_IN_MODERATE, TIME_IN_VIGOROUS);
    const effort = activity.getEffort(HR);

    expect(effort.moderate).toEqual(TIME_IN_MODERATE);
    expect(effort.vigorous).toEqual(TIME_IN_VIGOROUS);
  })

  it("fails if you get effort without streams", () => {
    const activity_without_streams = createWithElapsedTime(120);
    const error = () => activity_without_streams.getEffort(200);

    expect(error).toThrow();
  })
})