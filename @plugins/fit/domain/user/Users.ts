import {chain} from "lodash";
import User from "./User";
import { UserSchema } from "../../db/UserCollection";

export default class Users {
  private users: User[];

  private constructor(users: User[]) {
    this.users = users;
  }

  get length() {
    return this.users.length;
  }

  getFitscoreLeaderboard() {
    return chain(this.users)
      .map(u => u.serialize())
      .filter(u => !!u.fitScore)
      .sortBy("fitScore")
      .reverse()
      .value();
  }

  public static createFromDb(models: UserSchema[]) {
    const users = models.map(User.createFromDb);
    return Users.createFromList(users);
  }

  public static createFromList(users: User[]) {
    return new Users(users);
  }
}