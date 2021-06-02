import { Instance, Route } from '@sjbha/app';
import { Codec, string } from 'purify-ts';
import superagent from 'superagent';
import { AuthResponse } from '../common/StravaClient';

import { strava } from '../env';
import * as User from '../db/user';

const StravaQuery = Codec.interface ({
  code:  string,
  state: string
});

/**
 * After a user accepts on Strava's integrations hook, it will redirect us with an access code and the state we passed (auth token)
 * This route will verify the auth, and then initialize the user's account with defaults
 */
export const authAccept : Route = async req => {
  // Validate request query
  const params = StravaQuery
    .decode ({ ...req.query })
    .orDefault ({ code: '', state: '' });

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
    gender:   auth.athlete.sex,
    maxHR:    undefined,
    xp:       0,
    fitScore: 0,
    
    // auth update
    ...user,
    stravaId:     auth.athlete.id,
    refreshToken: auth.refresh_token
  });

  // Send an update to the user
  // todo: Add instructions in the message
  Instance
    .fetchMember (user.discordId)
    .then (member => member.send (`
      Congrats on connecting! I should add some instructions on what to do next! TODO YAY
    `));

  return 'You have been authorized with the bot, now go workout!';
}