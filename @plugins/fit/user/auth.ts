import querystring from "querystring";
import {basePath, url_login} from "@plugins/fit/config";
import {User} from "./userCollection";

import {debug} from "../config";

const tokenize = (user: User) => user.discordId + "." + user.password;

export const getStravaUrl = (user: User) => 
  basePath + url_login + "?" + querystring.stringify({
    token: tokenize(user)
  });