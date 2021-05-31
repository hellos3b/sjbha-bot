import { just, match } from 'variant';
import { ActivityType } from './StravaClient';

type Activity = { type: ActivityType };

export const activityEmoji = (activity: Activity, gender = 'M'): string => {
  const gendered = (male: string, female: string) => 
    (gender === 'F') ? just (female) : just (male);

  return match (activity, {
    Run:            gendered ('🏃‍♀️', '🏃'),
    Ride:           gendered ('🚴‍♀️', '🚴'),
    Yoga:           gendered ('🧘‍♀️', '🧘‍♂️'),
    Walk:           gendered ('🚶‍♀️', '🚶‍♂️'),
    Crossfit:       gendered ('🏋️‍♀️', '🏋️‍♂️'),
    WeightTraining: gendered ('🏋️‍♀️', '🏋️‍♂️'),
    RockClimbing:   gendered ('🧗‍♂️', '🧗‍♀️'),
    Hike:           just ('⛰️'),
    default:        gendered ('🤸‍♀️', '🤸‍♂️'),
  });
}