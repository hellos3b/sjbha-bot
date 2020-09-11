import Users from "../Users";
import User from "../User";
import Profile from "../Profile";
import Level from "../Level";
import FitScore from "../FitScore";

let users: Users;

const userModels = [
  User.create("user-1", Profile.create("M"), Level.create(0, 0), FitScore.create(80)),
  User.create("user-2", Profile.create("M"), Level.create(0, 0), FitScore.create(40)),
];

beforeAll(() => {
  users = Users.createFromList(userModels);
})

describe("Users", () => {
  it("returns sorted leaderboard", () => {
    const leaderboard = users.getFitscoreLeaderboard();

    expect(leaderboard).toHaveLength(userModels.length);
    expect(leaderboard[0].fitScore).toBeGreaterThan(leaderboard[1].fitScore);
  })
})