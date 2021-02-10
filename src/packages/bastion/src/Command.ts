import {Message} from "./Message";
import {Observable, MonoTypeOperatorFunction} from "rxjs";
import {filter} from "rxjs/operators";
import * as R from "ramda";
import * as O from "fp-ts/Option";
import {pipe} from "fp-ts/function";

export interface Command {
  stream: Observable<Message>;
  subscribe(callback: (req: Message) => void): void;
  restrict(...channelIds: string[]): Command;
  subcommand(name: string): Command;
}

export const commander = (stream: Observable<Message>) => (routeName: string) => {
  const r = stream.pipe(route(routeName));
  return Command(r);
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