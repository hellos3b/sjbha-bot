import {left, right, Either} from "fp-ts/Either";
import * as u from "../models/User";
import { InvalidArgsError } from "@packages/common-errors";

/**
 * Gets the current configuration setting
 */
export const get = (prop: string) => (user: u.User): Either<InvalidArgsError, string> => {
  switch (prop.toLowerCase()) {
    case "hr": 
      return right(`Your max heartrate is set to ${user.maxHR}`);

    default:
      return left(InvalidArgsError.create(`Invalid option '${prop}'. Possible options: hr`))
  }  
}

/**
 * Returns an Either with a fn to update a user's property
 */
export const set = (prop: string, value: string) => (user: u.User): Either<InvalidArgsError, u.User> => {  
  switch (prop.toLowerCase()) {
    case "hr": 
      return updateMaxHR(value)(user);

    default:
      return left(InvalidArgsError.create(`Invalid option '${prop}'. Possible options: hr`))
  }
};

const updateMaxHR = (value: string) => (user: u.User): Either<InvalidArgsError, u.User> => {
  const setTo = Number(value);

  if (isNaN(setTo)) 
    return left(InvalidArgsError.create(`Heart rate '${value}' is not a number`));

  if (setTo < 150 && setTo !== 0)
    return left(InvalidArgsError.create(`Are you sure?`));

  if (setTo > 220)
    return left(InvalidArgsError.create(`Are you sure?`));

  return right({
    ...user,
    maxHR: setTo
  });
}