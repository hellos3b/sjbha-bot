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
  /** Restricts this command to a set of channels */
  restrict(...channelIds: string[]): Command;
  /** Create a subcommand based on the 2nd arg of the command */
  subcommand(name: string): Command;
  /** Only respond to DMs */
  dm(): Command;
  /** Only respond to public server */
  public(): Command;
  /** When the command was ran with nothing but the base command */
  alone(): Command;
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
    Command(stream.pipe(middleware, share()));

  return {
    stream, 
    
    subscribe: (req) => 
      stream.subscribe(req),

    restrict: (...channelIds) => 
      extend(restrict(...channelIds)),

    subcommand: (name) => 
      extend(subcommand(name)),
    
    dm: () => extend(dm()),

    public: () => extend(publicMessage()),

    alone: () => extend(alone())
  };
};

const alone = () => filter<Message>(req => req.args.length === 1);

const dm = () => filter<Message>(req => req.type === "direct");

const publicMessage = () => filter<Message>(req => req.type !== "direct");

const route = (routeName: string) => filter<Message>(
  req => pipe(
    req.args.nth(0),
    O.map(R.equals(routeName)),
    O.getOrElse(R.F)
  )
);

const restrict = (...channelIds: string[]) => filter<Message>(req => channelIds.includes(req.channel.id));

const subcommand = (name: string) => filter<Message>(
  req => pipe(
    req.args.nth(1),
    O.map(R.equals(name)),
    O.getOrElse(R.F)
  )
);