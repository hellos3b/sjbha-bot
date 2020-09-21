import mongodb from '@services/mongodb';
import type {Collection} from 'mongodb';
import { MissingSub, SubConflict } from './errors';

const COLLECTION_NAME = 'subscriptions';

export interface Subscription {
  name: string;
  id: string;
}

const getCollection = () => mongodb.getCollection(COLLECTION_NAME) as Collection<Subscription>;

export const getAll = async () => getCollection().find().toArray();

export const getByName = async (name: string) => {
  const tag = await getCollection().findOne({ name })

  if (!tag) {
    throw new MissingSub(`Subscripton '${name}' does not exist`);
  }

  return tag;
}

export const save = async (name: string, id: string) => {
  const name_exists = await getCollection().findOne({name});
  if (!!name_exists) {
    throw new SubConflict(`Subscription with name '${name}' already exists`)
  }

  const id_exists = await getCollection().findOne({id});
  if (!!id_exists) {
    throw new SubConflict(`Subscription with id '${id}' already exists (${id_exists.name})`)
  }

  await getCollection().insertOne({id, name});
}

export const deleteSub = async (name: string) => {
  await getByName(name)
    .then(() => getCollection().deleteOne({name}));
}