import * as A from "fp-ts/Array";
import * as T from "fp-ts/Task";
import {chainW, fold, map, left, right} from "fp-ts/TaskEither";
import {pipe} from "fp-ts/function";

import * as U from "@packages/discord-fp/User";
import { ConflictError, NotFoundError } from "@packages/common-errors";

import { getByName, getAll, Subscription } from "./db";

import logger from "@packages/logger";
const log = logger("subscribe");

/**
 * List the available subscriptions that are in the database
 */
export function list() {
  log.info(`Sending out a list of subscriptions`);

  return pipe(
    getAll(),
    map (A.map(_ => _.name)),
    fold (
      () => T.of("Failed to fetch subscriptions"),
      l => T.of("Available subscriptions: " + l.join(", "))
    )
  );
}

/**
 * Adds a role to a member. Looks up by tag name
 */
export function addTo(member: U.GuildMember) {
  return (tag: string) => {
    log.info({user: member.id, tag}, `Subscribing ${member.displayName} to ${tag}`);

    return pipe(
      getByName (tag.toLowerCase()),
      chainW (sub => U.hasRole(member)(sub.id) 
        ? left(ConflictError.create(`You are already subscribed to '${tag}'`)) 
        : right(sub)
      ),
      chainW (subscribe (member)),
      fold (err => T.of(err.message), () => T.of(`You've been subscribed to '${tag}'`))
    );
  }
}

/**
 * Removes a subscription from a user, based on subscription name
 */
export function removeFrom(member: U.GuildMember) {
  return (tag: string) => {
    log.info({user: member.id, tag}, `Unsubscribing ${member.displayName} to ${tag}`);

    return pipe(
      getByName (tag.toLowerCase()),
      chainW (sub => !U.hasRole(member)(sub.id) 
        ? left (NotFoundError.create(`You are not subscribed to '${tag}'`))
        : right (sub)
      ),
      chainW (unsubscribe (member)),
      fold (err => T.of(err.message), () => T.of(`You've been unsubscribed from '${tag}'`))
    );
  }
}

function subscribe(member: U.GuildMember) {
  return (sub: Subscription) => pipe(sub.id, U.addRoleTo(member));
};

function unsubscribe(member: U.GuildMember) {
  return (sub: Subscription) => pipe(sub.id, U.removeRoleFrom(member));
}