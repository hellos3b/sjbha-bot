import * as D from "discord.js";

export type Guild = ReturnType<typeof Guild>;
export function Guild(g: D.Guild) {
  return {
    __guild: g,
    id: g.id
  };
}
