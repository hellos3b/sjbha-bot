import { Duration } from "luxon";

export const hr = (bpm: number) : string => Math.floor (bpm).toString ();
export const miles = (meters: number) : string => (meters * 0.000621371192).toFixed (2) + "mi";
export const feet = (meters: number) : string => (meters * 3.2808399).toFixed (0) + "ft";
export const power = (watts: number) : string => Math.floor (watts).toString ();
  
export const duration = (seconds: number) : string => {
   const d = Duration.fromObject ({ seconds });
  
   if (d.as ("hours") >= 1) 
      return d.toFormat ("hh:mm:ss");
   else if (d.as ("minutes") > 0) 
      return d.toFormat ("mm:ss");
   else
      return d.toFormat ("s") + " seconds";
};

export const pace = (ms: number) : string => {
   const t = Duration.fromObject ({
      minutes: (26.8224 / ms)
   });

   return (t.as ("hours") > 1)
      ? t.toFormat ("hh:mm:ss")
      : t.toFormat ("mm:ss");
};

export const exp = (amt: number) : string => 
   (amt >= 1000) 
      ? (amt / 1000).toFixed (1) + "k"
      : amt.toFixed (1);
