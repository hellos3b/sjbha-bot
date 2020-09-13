import {activity_emojis} from "@plugins/fit/config";

import {ActivityType} from "../../domain/strava/Activity";

export default class ActivityEmoji {
  private readonly activityType: string;
  private readonly gender: string;

  constructor(activityType: string, gender: string = "M") {
    this.activityType = activityType;
    this.gender = gender;
  }

  public toString() {
    let emojis = activity_emojis[this.activityType];

    if (!emojis) {
      emojis = activity_emojis[ActivityType.default];
    }

    return this.gender === "M" ? emojis[0] : emojis[1];
  }

}