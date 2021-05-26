import * as R from "ramda";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as A from "fp-ts/Array";
import { pipe, flow } from "fp-ts/lib/function";

import {findMember} from "@app/bot";
import * as db from "@packages/db";
import logger from "@packages/logger";
import { DecodeError } from "@packages/common-errors";
import * as U from "@packages/discord-fp/User";

export class NoRefreshTokenError extends Error {}

const collection = db.collection<Schema>("fit-users");
const log = logger("fit");

const UserT = t.interface({
  discordId: t.string,
  password: t.string,
  stravaId: t.number,
  refreshToken: t.string,
  gender: t.string,
  maxHR: t.number,
  xp: t.number,
  fitScore: t.number
});

type Schema = t.TypeOf<typeof UserT>;
export type User = Readonly<Schema> & { member: U.GuildMember };

const toSchema = (user: User): Schema =>
  R.omit(["member"])(user);

// TODO: Come up with better way to handle this
const withMember = (schema: Schema) => pipe(
  findMember(schema.discordId),
  TE.map (member => <User>({
    ...schema,
    member
  }))
)

const decode = (json: any) => pipe(
  TE.fromEither (UserT.decode(json)),
  TE.mapLeft (DecodeError.fromError),
  TE.chainW (withMember)
);

export const isAuthorized = (user: Schema) => !!user.refreshToken;

export const getAll = () => pipe(
  collection(),
  db.find<Schema>({}),
  TE.chainW (m => pipe(
    m.map(decode),
    A.sequence(T.task),
    T.map (A.rights),
    TE.rightTask
  ))
)

export const getAllAsAuthorized = flow(
  getAll,
  TE.map (m => m.filter(isAuthorized))
);

export const find = (query: db.Query<Schema>) => pipe(
  collection(),
  db.find<Schema> (query)
)

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

export const fetchByStravaId = (stravaId: number) => pipe(
  collection(),
  db.findOne <Schema>({stravaId}),
  TE.chainW (decode)  
)

export const initialize = (discordId: string, password: string) => {
  const user: Schema = {
    discordId, password,
    stravaId: -1,
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

export const save = (user: User) => {
  const model = toSchema(user);
  log.debug({model}, "Saving user to db");

  return pipe(
    collection(),
    db.update <Schema>({discordId: user.discordId}, model)
  );
}

const ranks = [
  'Hummingbird', 
  'Goldfinch', 
  'Thrasher',
  'Kingfisher', 
  'Peregrine Falcon', 
  'Golden Eagle'
];

const no_rank = 'Bushtit';

export const rank = (user: User) => {
  if (user.fitScore === 0)
    return no_rank;

  
  const name = pipe(
    Math.floor (user.fitScore / 20),
    R.clamp(0, ranks.length),
    i => ranks[i]
  );

  const remainder = user.fitScore % 20;
  const division = remainder < 5
    ? "I" : remainder < 10
    ? "II" : remainder < 15
    ? "III" 
    : "IV";
  
  return name + " " + division;
}