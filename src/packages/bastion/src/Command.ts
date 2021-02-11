import {Message} from "./Message";
import {Observable, MonoTypeOperatorFunction} from "rxjs";
import {filter, share} from "rxjs/operators";
import * as R from "ramda";
import * as O from "fp-ts/Option";
import {pipe} from "fp-ts/function";
import logger from "@packages/logger";

const log = logger("Command");

export interface Command {
  stream: Observable<Message>;
  subscribe(callback: (req: Message) => void): void;
  restrict(...channelIds: string[]): Command;
  subcommand(name: string): Command;
}

export type Commander = (instigator: string) => (routeName: string) => Command;

export const commander = (stream: Observable<Message>) => (instigator: string) => {
  const command$ = stream.pipe(
    filter(msg =>
      msg.content
        .toLowerCase()
        .startsWith(instigator)
    ),
    share()
  )

  command$.subscribe(msg => log.debug({content: msg.content}, "Incoming command"));

  return (routeName: string) => {
    const r = command$.pipe(route(instigator + routeName));
    return Command(r);
  }
}

export const Command = (stream: Observable<Message>): Command => {
  const extend = (middleware: MonoTypeOperatorFunction<Message>) => 
    Command(stream.pipe(middleware));

  return {
    stream, 
    
    subscribe: (req) => 
      stream.subscribe(req),

    restrict: (...channelIds) => 
      extend(restrict(...channelIds)),

    subcommand: (name) => 
      extend(subcommand(name))
  };
};

const route = (routeName: string) => filter<Message>(
  req => pipe(
    req.args.nth(0),
    O.map(R.equals(routeName)),
    O.getOrElse(R.F)
  )
);

const restrict = (...channelIds: string[]) => filter<Message>(req => {
  if (R.includes(req.channel.id, channelIds)) return true;

  console.log(`Command used outside of restricted channels (${channelIds})`);
  return false;
});

const subcommand = (name: string) => filter<Message>(
  req => pipe(
    req.args.nth(1),
    O.map(R.equals(name)),
    O.getOrElse(R.F)
  )
);