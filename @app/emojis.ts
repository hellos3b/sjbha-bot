import {IS_PRODUCTION} from "./env";

const emoji = (name: string, id: string) => ({
  id,
  toString() { return `<:${name}:${id}>`}
});

const production = {};

type Emojis = typeof production;

const development: Emojis = {};

const emojis = IS_PRODUCTION ? production : development;
export default emojis;