import { Collection, Db, MongoClient, } from 'mongodb';
import { createNanoEvents } from 'nanoevents';

type Events = {
  connect: (client: MongoClient) => void;
  connectFail: (error: Error) => void;
}

export const events = createNanoEvents<Events> ();

type Instance =
  | { tag: 'Connecting' }
  | { tag: 'Connected', instance: MongoClient }
  | { tag: 'Failed', error: Error };

let mongoClient: Instance = { tag: 'Connecting' };

export const connect = async (url: string) : Promise<MongoClient> => {
  try {
    const client = await MongoClient.connect (url, { useUnifiedTopology: true });
    mongoClient = { tag: 'Connected', instance: client };
    events.emit ('connect', client);
    return client;
  }
  catch (e) {
    const error = (e instanceof Error) ? e : new Error ('Unknown error occured');
    mongoClient = { tag: 'Failed', error };
    events.emit ('connectFail', error);
    throw error;
  }
}

export const disconnect = async () : Promise<void> => {
  if (mongoClient.tag === 'Connected' && mongoClient.instance.isConnected ()) {
    await mongoClient.instance.close ();
  }
}

const awaitClientConnect = async () => 
  new Promise <MongoClient> ((resolve, reject) => {
    const listeners = [
      events.on ('connect', client => {
        listeners.forEach (f => f ());
        resolve (client);
      }),

      events.on ('connectFail', error => {
        listeners.forEach (f => f ());
        reject (error);
      })
    ];
  });

export const getDb = async () : Promise<Db> => {
  switch (mongoClient.tag) {
    case 'Connecting':
      return awaitClientConnect ().then (client => client.db ());

    case 'Connected':
      return mongoClient.instance.db ();

    case 'Failed':
      throw mongoClient.error;
  }  
}

export const getCollection = async <T = unknown>(name: string) : Promise<Collection<T>> => {
  const db = await getDb ();
  return db.collection<T> (name);
}