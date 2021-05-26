export const HOSTNAME = required ('HOSTNAME');
export const HTTP_PORT = required ('VIRTUAL_PORT');
export const DISCORD_TOKEN = required ('DISCORD_TOKEN');

export const SERVER_ID = optional ('SERVER_ID');

  // todo: with docker, MONGO_URL will prolly be required
export const MONGO_URL = optional ('MONGO_URL');
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const IS_PRODUCTION = NODE_ENV === 'production';

export const TIME_ZONE = 'America/Los_Angeles';

// Helper functions
function required(key: string) : string {
  const value = process.env[key];
  if (!value) throw new Error (`Missing environment variable: ENV key '${key}' required but got '${value}'`)

  return value;
}

// simple way to give default string value
function optional(key: string) : string {
  const value = process.env[key];

  return value ? value : ''
}