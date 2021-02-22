import type {User} from "../../models/User";
import {promoteUser} from "../promote";

const base: User = {
  member: {
    id: "",
    name: "",
    avatar: ""
  },
  discordId: "",
  password: "",
  stravaId: "",
  refreshToken: "",
  gender: "M",
  maxHR: 0,
  xp: 0,
  fitScore: 0
};

describe("Promotions", () => {
  it("promotes when you reach the goal", () => {
    const [user, diff] = promoteUser({...base, fitScore: 0}, 300);

    expect(user.fitScore).toEqual(5);
    expect(diff).toEqual(5);
  });

  it("demotes when you have no XP", () => {
    const [user, diff] = promoteUser({...base, fitScore: 50}, 0);

    expect(user.fitScore).toEqual(45);
    expect(diff).toEqual(-5);
  });

  it("partially demotes you if you got some xp", () => {
    const [user, diff] = promoteUser({...base, fitScore: 50}, 100);

    expect(diff).toBeGreaterThan(-5);
    expect(diff).toBeLessThan(0);
  })

  it("caps you at 100", () => {
    const [user, diff] = promoteUser({...base, fitScore: 100}, 300);

    expect(user.fitScore).toEqual(100);
    expect(diff).toEqual(0);
  });
})