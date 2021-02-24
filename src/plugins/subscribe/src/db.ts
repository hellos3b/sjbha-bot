import {mapLeft, chainW, map, right, left, orElse} from "fp-ts/TaskEither";
import {pipe} from 'fp-ts/function';

import * as Discord from 'discord.js';

import * as db from '@packages/db';
import { ConflictError, NotFoundError } from '@packages/common-errors';

const collection = db.collection<Subscription>('subscriptions');
export interface Subscription {
  name: string;
  id: string;
}

export const getByName = (name: string) => pipe(
  collection(),
  db.findOne<Subscription>({name}),
  mapLeft (NotFoundError.lazy(`There is no subscription named '${name}'`))
);

export const getAll = () => pipe(
  collection(),
  db.find<Subscription>({})
);

const save = (role: Discord.Role) => pipe(
  collection(),
  db.insert<Subscription>({name: role.name, id: role.id})
);

export const create = (role: Discord.Role) => {
  return pipe(
    collection(),
    db.findOne<Subscription>({id: role.id}),
    chainW 
      (sub => left(ConflictError.create(`Subscription already with id '${role.id}'`, role, sub))),
    orElse 
      (err => (err instanceof NotFoundError) ? right(true) : left(err)),
    chainW
      (() => save(role)),
    map
      (() => `Added ${role.name} to the subscriptions list`)
  );
}

export const remove = (name: string) => pipe(
  getByName(name),
  chainW (() => pipe(
    collection(), 
    db.deleteOne<Subscription>({name})
  )),
  map (() => name)
);