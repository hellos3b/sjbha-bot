import { match, __ } from "ts-pattern";
import * as Command from "../../deprecating/Command";

import * as Profile from "./Profile";
import * as RockPaperScissors from "./game";
import { leaderboard } from "./leaderboard";
import { env } from "../../environment";

// Rock paper scissors!
export const throw_rps = Command.filtered ({
   filter: Command.Filter.and (
      Command.Filter.startsWith ("!throw"),
      Command.Filter.inChannel (env.CHANNEL_THROWDOWN)
   ),

   callback: async message =>
      match (Command.route (message))
         .with (__.nullish, () => Profile.render (message))
         .with ("leaderboard", () => leaderboard (message))
         .otherwise (hand => RockPaperScissors.play (message, hand ?? ""))
});