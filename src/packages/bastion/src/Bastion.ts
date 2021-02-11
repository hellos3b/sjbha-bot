import * as Discord from "discord.js";
import {Message} from "./Message";
import logger from "@packages/logger";
import {Commander, commander} from "./Command";
import {Observable, Subject} from "rxjs";

const log = logger("bastion");

export interface Bastion {
  readonly client: Discord.Client;
  readonly message$: Observable<Message>;
  readonly commander: Commander;
}

export const createBastion = (token: string): Bastion => {
  const client = new Discord.Client();
  const message$ = messageEmitter(client);

  client.on("ready", () => log.info(`Bastion connected as '${client.user?.tag}'`));
  client.login(token);

  return {
    client,
    message$,
    commander: commander(message$)
  };
}

const messageEmitter = (client: Discord.Client) => {
  const message$ = new Subject<Message>();

  client.on("message", (msg: Discord.Message) => {
    // ignore self
    if (msg.author.bot) return;

    const message = Message(msg);
    message$.next(message);
  });

  return message$.asObservable();
}