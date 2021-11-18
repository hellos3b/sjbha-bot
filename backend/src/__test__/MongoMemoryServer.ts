import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoDb } from '@sjbha/app';

let mongod: MongoMemoryServer | undefined = undefined;

export const setup = async () : Promise<void> => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create ();
  await MongoDb.connect (mongod.getUri ());
}

export const teardown = async () : Promise<void> => {
  if (!mongod) {
    console.warn ('Tried to tear down mongodb memory server, but server has not been started');
    return;
  }

  await MongoDb.disconnect ();
  await mongod.stop ();
} 