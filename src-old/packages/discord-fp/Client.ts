import * as Discord from "discord.js";
import logger from "@packages/logger";
import {Message} from "./Message";
import {Observable, Subject} from "rxjs";

const log = logger("bastion");

export const create = (token: string): [Discord.Client, Observable<Message>] => {
  const client = new Discord.Client();
  const message$ = new Subject<Message>();

  client.on("ready", () => log.info(`Bastion connected as '${client.user?.tag}'`));
  client.on("message", (msg: Discord.Message) => {
    if (msg.author.bot) return;
    message$.next(<Message>msg);
  });

  client.login(token);

  return [client, message$.asObservable()];
}