import {debug} from "@plugins/fit/config";
import { UserSchema } from "../../db/UserCollection";

export default class Profile {
  private _gender: string;

  protected constructor(gender: string = "M") {
    if (gender !== "M" && gender !== "F") {
      throw new Error(`Invalid gender provided: '${gender}'`);
    }
    
    this._gender = gender;
  }

  get gender() {
    return this._gender;
  }

  public updateGender(gender: string) {
    debug("update gender to %o", gender)

    if (gender !== "M" && gender !== "F") {
      throw new Error(`Invalid gender provided: '${gender}'`);
    }

    this._gender = gender;
  }

  public static create(gender: string) {
    return new Profile(gender);
  }

  public static createFromDb(user: UserSchema) {
    return new Profile(user.gender);
  }
}