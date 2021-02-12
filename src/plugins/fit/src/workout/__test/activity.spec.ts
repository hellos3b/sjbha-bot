import '@relmify/jest-fp-ts';
import * as O from "fp-ts/Option";
import {fromActivity, streams, timeInZone} from "../Workout";

import * as r from "./_sample_responses";

describe("Activity", () => {
  describe("streams", () => {
    const stream = streams([
      {type: "heartrate", data: [70, 100, 100, 180]},
      {type: "time",      data: [0,   5,   20,  21]}
    ]);

    it("maintains the same length of samples", () => {
      expect(stream).toHaveLength(4);
    });

    it("correctly counts duration", () => {
      const seconds = stream.map(_ => _.seconds);
      expect(seconds).toEqual([0, 5, 15, 1]);
    });

    it("returns empty if a zone is missing", () => {
      const stream = streams([{type: "heartrate", data: [140, 139]}]);
      expect(stream).toEqual([]);
    });

    it("sums zones properly", () => {
      const zones = timeInZone(180)(stream);
      expect(zones).toEqual({
        rest: 0,
        moderate: 20,
        vigorous: 1
      });
    });
  });

  describe("mapping from api", () => {
    it("includes gps", () => {
      const activity = fromActivity(r.activity_outdoor_with_heartrate);
      expect(activity.gps).toBeSome();
    });

    it("ignores gps", () => {
      const activity = fromActivity(r.activity_indoor_with_heartrate);
      expect(activity.gps).toBeNone();
    });

    it("includes heartrate", () => {
      const activity = fromActivity(r.activity_indoor_with_heartrate);
      expect(activity.heartrate).toBeSome();
    });

    it("includes stream", () => {
      const streamDto = [
        {type: "heartrate", data: [120, 120, 120, 160]},
        {type: "time",      data: [0,   5,   20,  21]}
      ];
      const activity = fromActivity(r.activity_indoor_with_heartrate, streamDto);
      const hr = O.toNullable(activity.heartrate);
      expect(hr?.stream).toHaveLength(4);
    });

    it("ignores heartrate", () => {
      const activity = fromActivity(r.activity_manual_workout);
      expect(activity.heartrate).toBeNone();
    });
  });
});