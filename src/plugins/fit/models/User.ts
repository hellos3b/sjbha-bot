import * as R from "ramda";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/lib/function";

import { server } from "@app/bastion";
import * as db from "@packages/db";
import { DecodeError } from "@packages/common-errors";
import { Member } from "@packages/bastion";

export class NoRefreshTokenError extends Error {}

const collection = db.collection<Schema>("fit-users");

const UserT = t.interface({
  discordId: t.string,
  password: t.string,
  stravaId: t.string,
  refreshToken: t.string,
  gender: t.string,
  maxHR: t.number,
  xp: t.number,
  fitScore: t.number
});

type Schema = t.TypeOf<typeof UserT>;
export type User = Schema & {member: Member};

const toSchema = (user: User): Schema =>
  R.omit(["member"])(user);

const decode = (json: any) => pipe(
  TE.fromEither
    (UserT.decode(json)),
  TE.mapLeft
    (DecodeError.fromError),
  TE.chain(user => pipe(
    server.getMember(user.discordId),
    TE.map
      (member => <User>({...user, member}))
  ))
);

export const fetch = (discordId: string) => pipe(
  collection(),
  db.findOne <Schema>({discordId}),
  TE.chainW (decode)
);

export const fetchConnected = flow(
  fetch,
  TE.chainW (user => 
    !user.refreshToken
      ? TE.left(new NoRefreshTokenError()) 
      : TE.right(user)
  )
)

export const initialize = (discordId: string, password: string) => {
  const user: Schema = {
    discordId, password,
    stravaId: "",
    refreshToken: "",
    gender: "",
    maxHR: 0,
    xp: 0,
    fitScore: 0
  };

  return pipe(
    collection(), 
    db.insert<Schema>(user),
    TE.map (() => user)
  );
};

export const save = (user: User) => pipe(
  collection(),
  db.update <Schema>(
    {discordId: user.discordId}, 
    toSchema(user)
  )
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