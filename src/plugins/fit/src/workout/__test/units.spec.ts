import {pipe} from "fp-ts/function";
import {meters, seconds, toFeet, toMiles, getTime, toMilesPerHour, metersPerSecond, toPace, Pace, formatElapsed, formatSpeed} from "../Units";

describe("Units", () => {
  describe("Conversions", () => {
    it("meters -> miles", () => {
      const miles = pipe(meters(1000), toMiles);
      expect(miles.value).toBeCloseTo(0.62);
    });

    it("meters -> feet", () => {
      const feet = pipe(meters(1000), toFeet);
      expect(feet.value).toBeCloseTo(3280.84);
    });

    it("seconds -> time", () => {
      const t = pipe(seconds(12345), getTime);
      expect(t.hours).toBe(3);
      expect(t.minutes).toBe(25);
      expect(t.seconds).toBe(45);
    });

    it("m/s -> mph", () => {
      const mph = toMilesPerHour(metersPerSecond(6.7056));
      expect(mph.value).toBeCloseTo(15);
    });

    it("m/s -> pace", () => {
      const pace = <Pace>toPace(metersPerSecond(2.5));
      
      expect(pace.value.hours).toBe(0);
      expect(pace.value.minutes).toBe(10);
      expect(pace.value.seconds).toBe(43);
    })
  });

  describe("Formatting", () => {
    it("shows two numbers max for elapsed time", () => {
      const hour = pipe(seconds(3600), formatElapsed);
      const thirtyMinutes = pipe(seconds(1800), formatElapsed);

      expect(hour).toEqual(expect.stringContaining("h"));
      expect(hour).not.toEqual(expect.stringContaining("s"));

      expect(thirtyMinutes).toEqual(expect.stringContaining("m"));
      expect(thirtyMinutes).not.toEqual(expect.stringContaining("h"));
    });

    it("formats pace into hh:mm:ss", () => {
      const pace = pipe(
        metersPerSecond(2.5),
        toPace,
        formatSpeed
      );

      expect(pace).toEqual(expect.stringContaining(":"));
    });

    it("formats mph to 'mph'", () => {
      const mph = pipe(
        metersPerSecond(6),
        toMilesPerHour,
        formatSpeed
      );

      expect(mph).toEqual(expect.stringContaining("mph"));
    });
  });
});