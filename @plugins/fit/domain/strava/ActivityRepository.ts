import {getStravaClient} from "../../strava-client";
import Activity, {Streams} from "./Activity";
import type {ActivityStreamResponse} from "../../strava-client";

export const getActivity = async (discordId: string, activityId: string) => {
  const client = await getStravaClient({discordId});
  const [activity, streams] = await Promise.all([
    client.getActivity(activityId),
    client.getActivityStreams(activityId)
  ]);

  return Activity.fromAPI(activity, getStreams(streams));
};


export const getActivityByStravaId = async (stravaId: string, activityId: string) => {
  const client = await getStravaClient({stravaId});
  const [activity, streams] = await Promise.all([
    client.getActivity(activityId),
    client.getActivityStreams(activityId)
      .then(getStreams)
      .catch(() => undefined)
  ]);

  return Activity.fromAPI(activity, streams);
};

const getStreams = (stream: ActivityStreamResponse): Streams => ({
  heartrate: stream.heartrate.data,
  time: stream.time.data
});