import Auth from "../Auth";

describe("Auth", () => {
  const user = Auth.init("fake_id");

  it("initialized user with a generated password", () => {
    expect(user.password).toBeTruthy();
  });

  it("correctly displays whether auth is connected", () => {
    expect(user.isConnected).toBeFalsy();
  });

  it("updated strava info", () => {
    user.linkToStrava("strava-id", "refresh-token");
    expect(user.stravaId).toEqual("strava-id");
    expect(user.refreshToken).toEqual("refresh-token");
  });
})