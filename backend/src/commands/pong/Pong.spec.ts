import * as Discord from 'discord.js';
import { command } from './Pong';

describe ('Pong', () => {
  it ('replies with a ping', () => {
    const reply = jest.fn ();
    const req = {
      content: '!pong',
      reply:   reply
    } as unknown as Discord.Message;

    command (req);

    expect (reply).toHaveBeenCalledWith ('Ping?');
  })
})