import { match } from "ts-pattern";
import * as Exp from "./Exp";
import * as Activity from "./Activity";

// Each user can customize what emoji shows up on their activity post
// which changes based on either activity type or intensity
export type emojiSet =
  | "people-default"
  | "people-female"
  | "objects"
  | "intensity"
  | "intensity-circle";

type intensity =
  | "time"
  | 1 | 2 | 3 | 4 | 5

// finds out how intense a workout was
const intensity = (exp: Exp.exp) : intensity => 
   match (exp)
      .with ({ type: "time" }, () : intensity => "time")
      .with ({ type: "hr" }, ({ moderate, vigorous }) : intensity => {
         const ratio = moderate / vigorous;
         return (ratio === 1) ? 1
            : (ratio > 0.75) ? 2
               : (ratio > 0.5) ? 3
                  : (ratio > 0.25) ? 4
                     : 5;
      })
      .exhaustive ();

export const get = (activityType: string, exp: Exp.exp, set: emojiSet = "people-default"): string => {
   const { type } = Activity;

   return match (set)
      .with ("people-default", () => 
         match (activityType)
            .with (type.Run, () => "🏃")
            .with (type.Ride, () => "🚴")
            .with (type.Yoga, () => "🧘‍♂️")
            .with (type.Walk, () => "🚶‍♂️")
            .with (type.Hike, () => "🚶‍♂️")
            .with (type.Crossfit, () => "🏋️‍♂️")
            .with (type.WeightTraining, () => "🏋️‍♂️")
            .with (type.RockClimbing, () => "🧗‍♀️")
            .otherwise (() => "🤸‍♂️"))

      .with ("people-female", () =>
         match (activityType)
            .with (type.Run, () => "🏃‍♀️")
            .with (type.Ride, () => "🚴‍♀️")
            .with (type.Yoga, () => "🧘‍♀️")
            .with (type.Walk, () => "🚶‍♀️")
            .with (type.Hike, () => "🚶‍♀️")
            .with (type.Crossfit, () => "🏋️‍♀️")
            .with (type.WeightTraining, () => "🏋️‍♀️")
            .with (type.RockClimbing, () => "🧗‍♂️")
            .otherwise (() => "🤸‍♀️"))

      .with ("objects", () =>
         match (activityType)
            .with (type.Run, () => "👟")
            .with (type.Ride, () => "🚲")
            .with (type.Yoga, () => "☮️")
            .with (type.Walk, () => "👟")
            .with (type.Hike, () => "🥾")
            .with (type.Crossfit, () => "💪")
            .with (type.WeightTraining, () => "💪")
            .with (type.RockClimbing, () => "⛰️")
            .otherwise (() => "💦"))

      .with ("intensity", () =>
         match (intensity (exp))
            .with ("time", () => "🕒")
            .with (1, () => "🙂")
            .with (2, () => "😶")
            .with (3, () => "😦")
            .with (4, () => "😨")
            .with (5, () => "🥵")
            .exhaustive ())

      .with ("intensity-circle", () =>
         match (intensity (exp))
            .with ("time", () => "🕒")
            .with (1, () => "🟣")
            .with (2, () => "🟢")
            .with (3, () => "🟡")
            .with (4, () => "🟠")
            .with (5, () => "🔴")
            .exhaustive ())
    
      .exhaustive ();
};