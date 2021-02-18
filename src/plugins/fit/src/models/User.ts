import * as R from "ramda";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/lib/function";

import * as db from "@packages/db";
import { DecodeError } from "@packages/common-errors";

export class NoRefreshTokenError extends Error {}

const collection = db.collection<User>("fit-users");

const SchemaT = t.interface({
  discordId: t.string,
  password: t.string,
  stravaId: t.string,
  refreshToken: t.string,
  gender: t.string,
  maxHR: t.number,
  xp: t.number,
  fitScore: t.number
});

export type User = t.TypeOf<typeof SchemaT>;

const decode = flow(
  SchemaT.decode, 
  E.mapLeft(DecodeError.fromError),
  TE.fromEither
);

export const byId = (discordId: string) => pipe(
  collection(),
  db.findOne <User>({discordId}),
  TE.chainW (decode)
);

export const byIdAuthorized = flow(
  byId,
  TE.chainW (user => 
    !user.refreshToken
      ? TE.left(new NoRefreshTokenError()) 
      : TE.right(user)
  )
)

export const save = (user: User) => pipe(
  collection(),
  db.update <User>({discordId: user.discordId}, user)
);

const ranks = [
  'Hummingbird', 
  'Goldfinch', 
  'Thrasher',
  'Kingfisher', 
  'Peregrine Falcon', 
  'Golden Eagle'
];

const no_rank = 'Bushtit';

export const fitScore = (user: User) => {
  const getName = (score: number) => pipe(
    Math.floor (score / 20),
    R.clamp(0, ranks.length),
    i => ranks[i]
  );
  
  return {
    value: user.fitScore, 
    rank: (user.fitScore === 0) 
      ? no_rank 
      : getName(user.fitScore)
  };
}