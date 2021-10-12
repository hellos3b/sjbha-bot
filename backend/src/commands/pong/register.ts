import { Message$ } from '@sjbha/app';

Message$
  .startsWith ('!pong')
  .replyWith ('Ping?');

Message$.startsWith ('!thread').subscribe (async message => {
  const channel = message.channel;
  
  if (channel.type === 'GUILD_TEXT') {
    const thread = await channel.threads.create ({
      name:                'Some Meetup - Oct 2',
      autoArchiveDuration: 60,
      reason:              'For the meetup'
      // startMessage:        message
    });
  }
});
