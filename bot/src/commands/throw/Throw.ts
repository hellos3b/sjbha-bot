import { match, __ } from "ts-pattern";
import * as Command from "../../Command";

import * as Profile from "./Profile";
import * as RockPaperScissors from "./game";
import { leaderboard } from "./leaderboard";

// Rock paper scissors!
export const throw_rps = Command.filtered ({
   filter: Command.Filter.and (
      Command.Filter.startsWith ("!throw"),
      Command.Filter.inChannel (process.env.CHANNEL_THROWDOWN)
   ),

   callback: async message =>
      match (Command.route (message))
         .with (__.nullish, () => Profile.render (message))
         .with ("leaderboard", () => leaderboard (message))
         .otherwise (hand => RockPaperScissors.play (message, hand ?? ""))
});