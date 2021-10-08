import { Instance, Route } from '@sjbha/app';
import { assert, defaulted, object, string } from 'superstruct';
import superagent from 'superagent';
import { AuthResponse } from '../common/StravaClient';

import { strava } from '../env';
import * as User from '../db/user';
import { MessageBuilder } from '@sjbha/utils/string-formatting';

const StravaQuery = object ({
  code:  defaulted (string (), () => ''),
  state: defaulted (string (), () => '')
});

/**
 * After a user accepts on Strava's integrations hook, it will redirect us with an access code and the state we passed (auth token)
 * This route will verify the auth, and then initialize the user's account with defaults
 */
export const authAccept : Route = async req => {
  const params = req.query;

  // Validate request query
  try {
    assert (params, StravaQuery);
  }
  catch (e) {
    return 'Error! code or state is missing'
  }

  if (!params.code) {
    return 'Something went wrong while authorizing. Try to use <b>!fit auth</b> again, and if it doesnt work contact @s3b';
  }

  // Make sure user exists
  const user = await User.findOne ({ authToken: params.state });

  if (!user) {
    return 'You need to initiate authorization with the bot before trying to connect; Use <b>!fit auth</b> in the #fitness channel';
  }

  // Fetch the refresh token
  const auth = await superagent
    .post ('https://www.strava.com/oauth/token')
    .send ({
      grant_type:    'authorization_code',
      code:          params.code,
      client_id:     strava.CLIENT_ID,
      client_secret: strava.CLIENT_SECRET
    })
    .then (r => r.body as AuthResponse);

  // Set the strava id + refresh token, plus additional defaults if user isn't set up
  await User.update ({
    // defaults
    emojis:   'people-default',
    maxHR:    undefined,
    xp:       0,
    fitScore: 0,
    
    // auth update
    ...user,
    stravaId:     auth.athlete.id,
    refreshToken: auth.refresh_token
  });

  // Send an update to the user
  const member = await Instance.fetchMember (user.discordId);

  member.map (member => {
    const intro = new MessageBuilder ();

    intro.append ('**Welcome to the #fitness channel!**');
    intro.append ('From now on, when you record an activity on Strava, it will be posted to the fitness channel.');
    intro.append ('Please note that there is a small minute delay after recording and when it posts. This is so you can edit your workout and add a title!');
    intro.space ();

    intro.append ('You will get exp for each workout you record. **If you are using a heartrate tracker** -- such as a garmin, fitbit, apple watch, or any other device -- You can get bonus exp for harder efforts. For this feature to work, set your max heartrate by sending me a message with `!fit settings`');
    intro.space ();

    intro.append ('Have fun, and make sure to hit those blob cheers!')

    member.send (intro.toString ());
  });

  return 'You have been authorized with the bot, now go workout!';
}