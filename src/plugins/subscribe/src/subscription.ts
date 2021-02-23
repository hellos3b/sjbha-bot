import Debug from "debug";
import format from "string-format";
import { DiscordMember, ErrorHandlers, request, echo } from "../_deprecate/old/app/bot/node_modules/@shared/bastion";
import { MissingSub } from "./errors";
import { map, pipe, join } from "ramda";
import { getAll, getByName, Subscription } from "./db";

const debug = Debug("@plugins/subscribe");

const getSubscriptions = () => getAll().then(pipe(
  map((sub: Subscription) => sub.name),
  join(", ")
))

const getSubList = () => getSubscriptions()
  .then(subs =>format("Available subscriptions: {0}", subs))

const userHasRole = (member: DiscordMember, roleId: string) => member.roles.cache.some(role => role.id === roleId);

const errorHandlers: ErrorHandlers = {
  [MissingSub.name]: (err) => getSubList().then(subs => err.message + ": " + subs)
}

/**
 * Let a user add a subscription
 * `!subscribe apex`
 */
export const add = request(async req => {
  const tag = await getByName(req.args[0]);

  if (userHasRole(req.member, tag.id)) return req.reply("You're already subscribed to '{0}'", tag.name);
  await req.member.roles.add(tag.id);

  debug(`Added role '${tag.name}' to ${req.member.displayName}`)
  return req.reply("You have been subscribed to '{0}'", tag.name);
}, errorHandlers);

/**
 * Remove subscription
 * `!unsubscribe apex`
 */
export const remove = request(async req => {
  const tag = await getByName(req.args[0]);

  if (!userHasRole(req.member, tag.id)) return req.reply("You're already subscribed to '{0}'", tag.name);
  await req.member.roles.remove(tag.id);
  
  debug(`Removed role '${tag.name}' from ${req.member.displayName}`)
  return req.reply("You have been unsubscribed from '{0}'", tag.name);
});

/**
 * List the available subscriptions
 */
export const list = echo(getSubList)