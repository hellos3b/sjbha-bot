import { Router, Message$ } from '@sjbha/app';
import { channels } from '@sjbha/config';

// Bot

import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';
import { settings } from './commands/settings'

Message$.startsWith ('!members').subscribe (async message => {
  const testIds = [
    '145398757582700544',
    '125829654421438464',
    '187593148065644544'
  ];


  const members = await MemberList.fetch (testIds);

  message.reply (testIds.map (id => members.nickname (id)).join (', '));


})

Message$
  .startsWith ('!fit')
  .restrictToChannel (channels.strava)
  .routes ({
    auth:     auth,
    profile:  profile,
    balance:  balance,
    leaders:  leaders,
    help:     help,
    empty:    help,
    settings: message => message.reply ('Settings menu is available only in DMs')
  });


Message$
  .equals ('!fit settings')
  .dmsOnly ()
  .subscribe (settings);

// Admin Commands

import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';
import { promote } from './admin/promote';

Message$
  .startsWith ('$fit')
  .adminOnly ()
  .routes ({
    post:    post,
    list:    list,
    remove:  remove,
    promote: promote
  });

// Web API

import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';
import { verifyToken } from './routes/verify-token';
import { MemberList } from './common/MemberList';

Router.get ('/fit/accept', authAccept);
Router.get ('/fit/api/webhook', verifyToken);
Router.post ('/fit/api/webhook', newWorkout);