
// Helper functions
const required = (key: string) : string => {
  const value = process.env[key];
  if (!value) throw new Error (`Missing environment variable: ENV key '${key}' required but got '${value}'`)

  return value;
}

// simple way to give default string value
const optional = (key: string) : string => {
  const value = process.env[key];

  return value ? value : ''
}

export const getOrThrow = (key: string) : string => required (key);

// Env Variables

export const HOSTNAME = required ('HOSTNAME');
export const UI_HOSTNAME = required ('UI_HOSTNAME');
export const HTTP_PORT = required ('HTTP_PORT');
export const DISCORD_TOKEN = required ('DISCORD_TOKEN');

export const SERVER_ID = optional ('SERVER_ID');

// todo: with docker, MONGO_URL will prolly be required
export const MONGO_URL = optional ('MONGO_URL');
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const IS_PRODUCTION = NODE_ENV === 'production';

export const TIME_ZONE = 'America/Los_Angeles';

export const VERSION = process.env.npm_package_version;