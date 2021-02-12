import '@relmify/jest-fp-ts';
import * as O from "fp-ts/Option";

import * as strava from "../../io/__mock__/activity_responses";

import {fromActivity} from "../Workout";

describe("Workout", () => {
  describe("Mapping Activity", () => {
    it("includes gps", () => {
      const activity = fromActivity(strava.activity_outdoor_with_heartrate);
      expect(activity.gps).toBeSome();
    });

    it("ignores gps", () => {
      const activity = fromActivity(strava.activity_indoor_with_heartrate);
      expect(activity.gps).toBeNone();
    });

    it("includes heartrate", () => {
      const activity = fromActivity(strava.activity_indoor_with_heartrate);
      expect(activity.heartrate).toBeSome();
    });

    it("includes stream", () => {
      const streamDto = [
        {type: "heartrate", data: [120, 120, 120, 160]},
        {type: "time",      data: [0,   5,   20,  21]}
      ];
      const activity = fromActivity(strava.activity_indoor_with_heartrate, streamDto);
      const hr = O.toNullable(activity.heartrate);
      expect(hr?.stream).toHaveLength(4);
    });

    it("ignores heartrate", () => {
      const activity = fromActivity(strava.activity_manual_workout);
      expect(activity.heartrate).toBeNone();
    });
  });
});