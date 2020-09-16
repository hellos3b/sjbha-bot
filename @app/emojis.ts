import {IS_PRODUCTION} from "./env";

const emoji = (name: string, id: string) => ({
  id,
  toString() { return `<:${name}:${id}>`}
});

const production = {
  santaparrot: emoji("santaparrot", "526861282268413973")
};

type Emojis = typeof production;

const development: Emojis = {
  santaparrot: emoji("upvote", "628403556675878922")
};

const emojis = IS_PRODUCTION ? production : development;
export default emojis;