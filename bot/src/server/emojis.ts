import { env } from '../app';

const emoji = (name: string, id: string) => ({
  id,
  toString() { return `<:${name}:${id}>` }
});

const production = {};

type Emojis = typeof production;

const development: Emojis = {};

const emojis = env.IS_PRODUCTION ? production : development;
export default emojis;