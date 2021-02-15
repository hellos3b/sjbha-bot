// import {Codec, string, number, GetType} from "purify-ts";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import {sequenceT} from "fp-ts/Apply";
import {flow} from "fp-ts/function";

import {server} from "@app/bastion";
import type {Member} from "@packages/bastion";
import {collection} from "@packages/collection/collection";

import * as U from "../core/User";
import { pipe } from "fp-ts/lib/pipeable";

export const UserCodec = t.interface({
  discordId: t.string,
  password: t.string,
  stravaId: t.string,
  refreshToken: t.string,
  gender: t.string,
  maxHR: t.number,
  xp: t.number,
  fitScore: t.number
});

export type User = t.TypeOf<typeof UserCodec>;
const Users = collection('fit-users', UserCodec);

const mapToModel = (user: User) => pipe(
  server.getMember(user.discordId),
  TE.map(U.fromDatabase(user))
)

export const fetchUser = flow(Users.findOne, TE.chain(mapToModel));

export const findOneAuthorized = flow(
  fetchUser,
  TE.chainEitherK(U.asAuthorized)
);

export const save = (user: U.User) => {};