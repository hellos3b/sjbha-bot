import * as MongoDb from './MongoDb';

type Setting = { key: string; data: unknown; }
const getCollection = async () => 
  MongoDb.getCollection <Setting> ('settings');

export const get = async <T>(key: string, defaults: T): Promise<T> => {
  const settings = await getCollection ();
  const result = await settings.findOne ({ key });

  return result ? (result.data as T) : defaults;
}

export const save = async <T>(key: string, data: T): Promise<void> => {
  const settings = await getCollection ();
  await settings.replaceOne (
    { key }, 
    { key, data }, 
    { upsert: true }
  );
}