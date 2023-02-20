import { match } from "ts-pattern";
import { add } from "ramda";
import type * as Activity from "./Activity";
import type * as StravaAPI from "./StravaAPI";

export type hr = 
  { type: "hr"; moderate: number; vigorous: number }

export type time =
  { type: "time"; exp: number }

export type exp =
  | hr
  | time

export const hr = (moderate: number, vigorous: number) : exp =>
   ({ type: "hr", moderate, vigorous });

export const time = (exp: number) : exp =>
   ({ type: "time", exp });

export const total = (exp: exp) : number =>
   match (exp)
      .with ({ type: "hr" }, ({ moderate, vigorous }) => moderate + vigorous)
      .with ({ type: "time" }, ({ exp }) => exp)
      .exhaustive ();

export const sum = (exp: exp[]) : number =>
   exp.map (total).reduce (add, 0);
  
export const isHr = (exp: exp) : exp is hr =>
   exp.type === "hr";

// Calculate the amount of EXP gained from a workout.
//
// If the user has their Max heartrate set and the activity was recorded with an HR compatible device,
// the user will get 1 exp for every second in Moderate (max heartrate x 0.5)
// and 2 exp for every second in Vigorous (max heartrate x 0.75)
// 
// If there is no heart rate data available, the calculation defaults to 1exp per second of moving time
export const fromActivity = (
   maxHeartrate: number | undefined, 
   activity: Activity.activity, 
   streams: StravaAPI.stream[]
) : exp => {
   const hrStream = streams.find (s => s.type === "heartrate")?.data;
   const timeStream = streams.find (s => s.type === "time")?.data;

   // Max HR and hr data is required to be calculated by hr
   if (maxHeartrate && hrStream && timeStream) {
      const moderate = maxHeartrate * 0.5;
      const vigorous = maxHeartrate * 0.75;

      let moderateSeconds = 0;
      let vigorousSeconds = 0;

      for (let i = 0; i < hrStream.length; i++) {
         const bpm = hrStream[i];
         const seconds = (timeStream[i + 1])
            ? (timeStream[i + 1] - timeStream[i])
            : 0;

         if (bpm >= vigorous)
            vigorousSeconds += seconds;
         else if (bpm >= moderate)
            moderateSeconds += seconds;
      }

      // gotta convert to minutes
      return hr (
         moderateSeconds / 60, 
         (vigorousSeconds / 60) * 2
      );
   }
   else {
      const minutes = activity.moving_time / 60;
      return time (minutes);
   }
};