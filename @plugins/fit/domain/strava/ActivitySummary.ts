import _ from "lodash";
import {ActivityResponse} from "../../strava-client";
import Seconds from "./Seconds";
import Activity from "./Activity";

/**
 * View object that holds an immutable list of activities,
 * and formats certain fields
 */
export default class ActivitySummary {
  private readonly _activities: Activity[];

  private constructor(activities: Activity[]) {
    this._activities = activities;
  }

  get count() {
    return this._activities.length;
  }

  /** Sum of all elapsed time in activities */
  get totalTime() {
    return _.chain(this._activities)
      .reduce((total, activity) => total + activity.elapsedTime.value, 0)
      .thru(t => new Seconds(t))
      .value();
  }

  /** An overview of all activities */
  private getSummary(): SummaryStats[] {
    return _.chain(this._activities)
      .groupBy(a => a.type)
      .map((activities, type) => {
        const summary = ActivitySummary.createFromList(activities);

        // todo: this.getStats() returns this instead? and this could be `getTypeStats()` or something
        return {
          type,
          count     : summary.count,
          totalTime : summary.totalTime
        };
      })
      .value();
  }

  /** Returns the most recent activity. Can be null if none recorded */
  private getLastActivity() {
    return _.last(this._activities);
  }

  public getDetails(): SummaryDetails {
    const lastActivity = this.getLastActivity();

    return {
      count       : this._activities.length,
      lastActivity: this.getLastActivity(),
      stats       : this.getSummary()
    }
  }

  public static createFromList(activities: Activity[]) {
    return new ActivitySummary(activities);
  }

  public static createFromAPI(activities: ActivityResponse[]) {
    const models = activities.map(_ => Activity.fromAPI(_));
    return new ActivitySummary(models);
  }
}

export interface SummaryDetails {
  count: number;
  lastActivity?: Activity;
  stats: SummaryStats[];
}

export interface SummaryStats {
  type: string;
  count: number;
  totalTime: Seconds;
}