import { MessageHandler, env } from '@sjbha/app';

import * as format from '@sjbha/utils/string-formatting';
import { strava } from '../env';
import * as User from '../db/user';

/**
 * The initial command users use to set their password and connect to Strava
 */
export const auth : MessageHandler = async message => {
  const user = await User.init (message.author.id);

  const params = {
    client_id:       strava.CLIENT_ID,
    redirect_uri:    env.HOSTNAME + '/fit/accept',
    scope:           'read,activity:read_all,profile:read_all', 
    state:           user.authToken,
    response_type:   'code',
    approval_prompt: 'force'
  };

  const query = Object.entries (params)
    .map (([key, value]) => key + '=' + value)
    .join ('&');

  const authUrl = 'http://www.strava.com/oauth/authorize?' + query

  const dm = new format.MessageBuilder ();

  dm.append ('Welcome to the fitness channel!');
  dm.space ();

  dm.append ('Click here to authorize the bot: {url}', { url: authUrl });
  dm.space ();
  
  dm.append ('You will be asked to authorize your account with the SJBHA bot. If you do not have a strava account, you can sign up here: <https://www.strava.com>');

  message.author.send (dm.toString ());

  if (message.channel.type !== 'dm') {
    message.reply ('Check your DMs for instructions on how to connect with strava');
  }
}