// import {Codec, string, number, GetType} from "purify-ts";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {flow} from "fp-ts/function";

import {server} from "@app/bastion";
import {collection} from "@packages/collection/collection";

import * as U from "../core/User";
import { pipe } from "fp-ts/lib/pipeable";
import { DecodeError, NotFound, Unauthorized } from "@packages/common-errors";

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
const Users = collection<User>('fit-users');

const mapToModel = flow(
  UserCodec.decode, 
  TE.fromEither,
  TE.mapLeft(DecodeError.fromError),
  TE.chain(user => pipe(
    server.getMember(user.discordId),
    TE.map(U.fromDatabase(user))
  ))
);

export const fetchUser = flow(
  Users.findOne, 
  TE.chainEitherK(E.fromNullable(NotFound.create("User does not exist"))),
  TE.chain(mapToModel)
);

export const fetchUserAsAuthorized = flow(
  fetchUser, 
  TE.mapLeft(Unauthorized.lazy("boo")),
  TE.chainEitherK(U.asAuthorized)
);

export const save = (user: U.User) => {};