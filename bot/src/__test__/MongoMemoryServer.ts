import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoDb, Log } from '../app';

const log = Log.make ('mock:mongo-memory-server');
let mongod: MongoMemoryServer | undefined = undefined;

export const setup = async () : Promise<void> => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create ();
  await MongoDb.connect (mongod.getUri ());
}

export const teardown = async () : Promise<void> => {
  if (!mongod) {
    log.debug ('Tried to tear down mongodb memory server, but server has not been started');
    return;
  }

  await MongoDb.disconnect ();
  await mongod.stop ();
} 