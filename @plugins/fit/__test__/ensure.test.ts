import {weekly_post_hour, wekely_post_weekday} from "../config";

describe("Ensure", () => {
  // This ensures these properties are set to the expected time
  // Often while developing we'll set this to test at a faster rate, and then forget to switch it back. 
  // This test will fail if we forget
  it("weekly post is set to the right time", () => {
    expect(weekly_post_hour).toEqual(8);
    expect(wekely_post_weekday).toEqual(1);
  })
});