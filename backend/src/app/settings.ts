import { db } from './mongodb';

type Setting = { key: string; data: unknown; }
const collection = db<Setting> ('settings');

interface Settings<T> {
  get: () => Promise<T>;
  save: (model: T) => Promise<void>;
}

export const Settings = <T>(key: string, defaults: T): Settings<T> => ({
  async get() : Promise<T> {
    const result = await collection ().findOne ({ key });

    return result ? (result.data as T) : defaults;
  },

  async save(data: T) : Promise<void> {
    await collection ().replaceOne (
      { key }, 
      { key, data }, 
      { upsert: true }
    );
  }
});