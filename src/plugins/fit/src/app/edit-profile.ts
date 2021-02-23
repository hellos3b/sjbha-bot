import {left, right} from "fp-ts/Either";
import {flow} from "fp-ts/function";
import {Lens} from "monocle-ts";
import * as u from "../models/User";
import { InvalidArgsError } from "@packages/common-errors";

const hr = Lens.fromProp<u.User>()('maxHR');

/**
 * Gets the current configuration setting
 */
export const get = (prop: string) => {
  switch (prop.toLowerCase()) {
    case "hr": 
      return right(flow(hr.get, _ => `Your max heartrate is set to ${_}`));

    default:
      return left(InvalidArgsError.create(`Invalid option '${prop}'. Possible options: hr`))
  }  
}

/**
 * Returns an Either with a fn to update a user's property
 */
export const edit = (prop: string, value: string) => {  
  switch (prop.toLowerCase()) {
    case "hr": 
      return maxHr(value);

    default:
      return left(InvalidArgsError.create(`Invalid option '${prop}'. Possible options: hr`))
  }
};

const maxHr = (value: string) => {
  const setTo = Number(value);

  if (isNaN(setTo)) 
    return left(InvalidArgsError.create(`Heart rate '${value}' is not a number`));

  if (setTo < 150 && setTo !== 0)
    return left(InvalidArgsError.create(`Are you sure?`));

  if (setTo > 220)
    return left(InvalidArgsError.create(`Are you sure?`));

  return right(hr.set(setTo));
}