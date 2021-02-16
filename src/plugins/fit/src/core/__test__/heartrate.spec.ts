import '@relmify/jest-fp-ts';
import * as O from "fp-ts/Option";

import WorkoutBuilder from "./_WorkoutBuilder_";
import * as hr from "../Heartrate";

describe("Heartrate", () => {
  describe("Mapping Streams", () => {
    const stream: hr.Stream = hr.streamFromResponse([
      {type: "heartrate", data: [70, 100, 180, 100]},
      {type: "time",      data: [0,   5,   20,  21]}
    ]);

    it("maintains the same length of samples", () => {
      expect(stream).toHaveLength(4);
    });

    it("correctly counts duration", () => {
      const seconds = stream.map(_ => _.seconds);
      expect(seconds).toEqual([5, 15, 1, 0]);
    });

    it("returns empty if a zone is missing", () => {
      const stream = hr.streamFromResponse([{type: "heartrate", data: [140, 139]}]);
      expect(stream).toEqual([]);
    });
  });

  describe("Zones", () => {
    it("sums zones based off HR", () => {
      const zones = hr.zones(200);
      const workout = WorkoutBuilder()
        .addHRSample(50, 5)    // rest
        .addHRSample(110, 10)  // moderate
        .addHRSample(120, 10)  // moderate
        .addHRSample(180, 10)  // vigorous
        .build();
      
      const heartrate = O.toNullable(workout.heartrate);
      const result = hr.timeInZone(zones)(heartrate!.stream);

      expect(result.rest.as("seconds")).toEqual(5);
      expect(result.moderate.as("seconds")).toEqual(20);
      expect(result.vigorous.as("seconds")).toEqual(10);
    });
  });
});