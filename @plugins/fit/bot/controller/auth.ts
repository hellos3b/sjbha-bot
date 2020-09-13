import {Request} from "@services/bastion";
import * as querystring from "querystring";

import {debug, basePath} from "@plugins/fit/config";
import {getOrInitializeUser} from "../../domain/auth/AuthRepository";


/**
 * Sets up a new User
 */
export async function auth(req: Request) {
  const user = await getOrInitializeUser(req.author.id);

  const url = basePath + "/login?" + querystring.stringify({
    token: user.id + "." + user.password
  })

  // todo: update welcome command
  req.author.send(`
Welcome to the fitness channel! 

The bot works by listening for activities that get posted to **Strava**. If you don't have an account, you can sign up here: <https://www.strava.com>. Once you have an account, you need to give me permission to access your data, which will let me listen for new posts and fetch the details of it. Click the following link and accept the authorization:

<${url}>

Once you accept, you'll be asked to set your max heart rate. If you use a watch or a heart rate strap, you can get extra EXP for working out hard! If at any time you want to update your HR MAX, just click the above link again! Have fun!
  `);
  
  req.reply("Welcome to the new `fit` bot! I've DM'd you instructions on how to connect your account");
}