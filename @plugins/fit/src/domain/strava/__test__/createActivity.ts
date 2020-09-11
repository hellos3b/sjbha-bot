import Activity, { Streams } from "../Activity";
import { ActivityResponse } from "../../../strava-client/types";

/**
 * Create an activity with no streams, but an elapsed time.
 * Used to calculate EXP when HR data is missing
 */
export const createWithElapsedTime = (elapsedTime: number) => 
  Activity.fromAPI(
    <ActivityResponse>{
      has_heartrate: false,
      elapsed_time: elapsedTime
    }, 
    undefined
  );

/**
 * creates an activity with HR streams
 */
export const createWithStreams = (maxHR: number, timeInModerate: number, timeInVigorous: number) => {
  const zones = Activity.getEffortZones(maxHR);

  const streams: Streams = {
    heartrate: [zones.moderate, zones.vigorous],
    time: [timeInModerate, timeInModerate + timeInVigorous]
  };

return Activity.fromAPI(<ActivityResponse>{
    has_heartrate: true,
    elapsed_time: timeInModerate + timeInVigorous,
  }, streams);
};