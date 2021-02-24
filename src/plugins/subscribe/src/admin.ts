import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { chainW, map, fromOption, right } from "fp-ts/lib/TaskEither";

import * as M from "@packages/discord-fp/Message";
import { InvalidArgsError } from "@packages/common-errors";

import * as db from "./db";

const usage = [
  `Usage:`,
  '`!fit sub-admin add @role`',
  '`!fit sub-admin rm <name>`'
].join("\n");

export const handle = (msg: M.Message) => {
  const reply = M.replyTo(msg);
  const args = M.parse(msg);
  const route = pipe(M.nth(1)(args), O.getOrElse(() => ""));

  const addSubscription = () => pipe(
    O.fromNullable (msg.mentions.roles.first()),
    fromOption (InvalidArgsError.lazy(usage)),
    chainW (db.create)
  );

  const removeSubscription = () => pipe(
    M.nth(2)(args),
    fromOption (InvalidArgsError.lazy(`Missing name: \`!fit sub-admin rm <name>\``)),
    chainW (db.remove),
    map (name => `Removed role '${name}' from list of subscriptions`)
  )

  const pipeline = 
    (route === "add")     ? addSubscription()
    : (route === "rm")    ? removeSubscription()
    : right(usage);

  return pipeline()
    .then(E.fold(err => reply(err.message), reply));
}