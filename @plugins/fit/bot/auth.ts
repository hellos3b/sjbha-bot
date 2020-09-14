import {Request} from "@services/bastion";
import * as querystring from "querystring";

import {basePath, url_login, url_help} from "@plugins/fit/config";
import {getOrInitializeUser} from "../domain/auth/AuthRepository";


/**
 * Sets up a new User
 */
export async function auth(req: Request) {
  const user = await getOrInitializeUser(req.author.id);

  const url = basePath + url_login + "?" + querystring.stringify({
    token: user.id + "." + user.password
  })
  const helpUrl = basePath + url_help;

  // todo: update welcome command
  req.author.send(`
**Welcome to the fitness channel!**

Click here to authorize the bot: ${url}
If you don't have a Strava Account: <https://www.strava.com/>
For information on how the bot works: ${helpUrl}
`);
  
  req.reply("Hello! I've DM'd you instructions on how to connect your account");
}