import { ErrorHandlers, request, echo, pre, bold } from "@services/bastion";
import { map, join } from "ramda";
import { deleteSub, getAll, save } from "./db";
import { BadArgs, SubConflict } from "./errors";
import format from "string-format";

const helpStr = join("\n",[
  bold("Add a new tag:"),
  pre("!subscribe-admin add [tagName] [tagId]"),
  bold("Remove an existing tag:"),
  pre("!subscribe-admin rm [tagName]"),
  bold("List existing tags and Ids:"),
  pre("!subscribe-admin list")
]);

const errorHandler: ErrorHandlers = {
  [BadArgs.name]: () => format("Invalid arguments. Usage: \n{0}", helpStr),
  [SubConflict.name]: (err) => err.message
}

const getSub = (args: string[]) => {
  const [, name, id] = args;
  if (!name || !id) throw new BadArgs(`Name or ID is missing (${{name, id}})`);
  return {name, id}
}

/**
 * Add a subscription to the database
 * `!subscribe-admin add among-us 123456`
 */
export const add = request(async req => {
  const {name, id} = getSub(req.args);
  await save(name, id);

  req.reply(`Added '${name}' to list of subscriptions!`);

}, errorHandler);

/**
 * Remove a subscription from the database
 * `!subscribe-admin rm among-us 123456`
 */
export const remove = request(async req => {
  const {name, id} = getSub(req.args);
  await deleteSub(name);

  req.reply(`Removed '${name}' from the list of subscriptions!`);
}, errorHandler);

/**
 * List the subscriptions along with the ID's
 */
export const list = request(async req => {
  const subs = await getAll();

  const msg = map(
    sub => format("**{0}** [{1}]", sub.name, sub.id),
    subs
  ).join("\n");

  await req.reply(msg);
})

export const help = echo(helpStr);