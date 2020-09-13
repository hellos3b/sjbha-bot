import { DateTime } from "luxon";

import {getStravaClient} from "../../strava-client";
import ActivitySummary from "./ActivitySummary";

/** Returns a summary of the last 30 days of activities */
export const getActivitySummary = async (discordId: string) => {
  const client = await getStravaClient({discordId});

  // We only get last 30 days for summary. Set hour to 0 so time is irrelevant
  const start = DateTime.local()
    .minus({days: 30})
    .set({hour: 0})

  const activities = await client.getActivities({
    after: start.toMillis() / 1000,
    page: 1,
    per_page: 100
  });

  return ActivitySummary.createFromAPI(activities);
};