import * as E from "fp-ts/Either";
import { MessageOptions } from "discord.js";

export const errorResponse = (err: Error): E.Either<Error, MessageOptions> => {
  switch (err.name) {
    case "Unauthorized": 
      return E.right({content: err.message});
    default: 
      return E.left(err);
  }
}