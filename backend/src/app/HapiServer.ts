import Hapi from '@hapi/hapi';

type HapiOptions = {
  port: number | string;
  routes: Hapi.ServerRoute[]
}

export const start = ({ port, routes }: HapiOptions) : Promise<void> => {
  const server = Hapi.server ({
    port:   port,
    host:   '0.0.0.0',
    routes: {
      cors: true
    }
  });

  server.route (routes);

  return server.start ();
}