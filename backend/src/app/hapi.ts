import Hapi from '@hapi/hapi';

import { HOSTNAME, HTTP_PORT } from './env';

const server = Hapi.server ({
  port: HTTP_PORT,
  host: '0.0.0.0'
});

server
  .start ()
  .then (() => console.log ('Hapi Server running on %o port %o', HOSTNAME, HTTP_PORT));

export type Route = Hapi.Lifecycle.Method | Hapi.HandlerDecorations;

export const Router = {
  get: (path: string, handler: Route) : void => {
    server.route ({ method: 'GET', path, handler });
  },

  post: (path: string, handler: Route) : void => {
    server.route ({ method: 'POST', path, handler });
  }
}