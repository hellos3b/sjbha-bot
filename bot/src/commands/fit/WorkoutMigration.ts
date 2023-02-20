import type * as Workout from "./Workout";
import * as Exp from "./Exp";

type Schema__V0 = {
  discord_id: string;
  activity_id: number;
  activity_name: string;
  timestamp: string;
  activity_type: string;
  exp_type: "hr" | "time";
  exp_gained: number;
  exp_vigorous: number;
}

export type legacy = Schema__V0;

const v0 = (model: Schema__V0) : Workout.workout => {
   const exp = (model.exp_type === "hr")
      ? Exp.hr (model.exp_gained - model.exp_vigorous, model.exp_vigorous)
      : Exp.time (model.exp_gained);

   return migrate ({ 
      ...model, 
      __version:  1,
      message_id: "",
      exp
   });
};

export const migrate = (w: Workout.workout | legacy) : Workout.workout => {
   if (!("__version" in w)) {
      return v0 (w);
   }

   return w;
};
