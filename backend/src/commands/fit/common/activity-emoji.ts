import { just, match } from 'variant';
import * as Workout from '../db/workout';

export type EmojiSet =
  | 'people-default'
  | 'people-female'
  | 'objects'
  | 'intensity'
  | 'intensity-circle';

export type WorkoutDetails = {
  type: string;
  exp: Workout.Exp;
}

export const activityEmoji = (workout: WorkoutDetails, set: EmojiSet = 'people-default'): string => {
  switch (set) {
    case 'people-default': return match (workout, {
      Run:            just ('🏃'),
      Ride:           just ('🚴'),
      Yoga:           just ('🧘‍♂️'),
      Walk:           just ('🚶‍♂️'),
      Hike:           just ('🚶‍♂️'),
      Crossfit:       just ('🏋️‍♂️'),
      WeightTraining: just ('🏋️‍♂️'),
      RockClimbing:   just ('🧗‍♀️'),
      default:        just ('🤸‍♂️'),
    });

    case 'people-female': return match (workout, {
      Run:            just ('🏃‍♀️'),
      Ride:           just ('🚴‍♀️'),
      Yoga:           just ('🧘‍♀️'),
      Walk:           just ('🚶‍♀️'),
      Hike:           just ('🚶‍♀️'),
      Crossfit:       just ('🏋️‍♀️'),
      WeightTraining: just ('🏋️‍♀️'),
      RockClimbing:   just ('🧗‍♂️'),
      default:        just ('🤸‍♀️')
    });

    case 'objects': return match (workout, {
      Run:            just ('👟'),
      Ride:           just ('🚲'),
      Yoga:           just ('☮️'),
      Walk:           just ('👟'),
      Hike:           just ('🥾'),
      Crossfit:       just ('💪'),
      WeightTraining: just ('💪'),
      RockClimbing:   just ('⛰️'),
      default:        just ('💦')
    });

    case 'intensity': return match (workout.exp, {
      time: just ('🕒'),
      hr:   ({ moderate, vigorous }) => {
        const ratio = moderate / (moderate + vigorous);

        return (ratio === 1) ? '🙂'
          : (ratio > 0.75) ? '😶'
          : (ratio > 0.5) ? '😦'
          : (ratio > 0.25) ? '😨'
          : '🥵';
      }
    });

    case 'intensity-circle': return match (workout.exp, {
      time: just ('🕒'),
      hr:   ({ moderate, vigorous }) => {
        const ratio = moderate / (moderate + vigorous);

        return (ratio === 1) ? '​🟣'
          : (ratio > 0.75) ? '🟢'
          : (ratio > 0.5) ? '🟡'
          : (ratio > 0.25) ? '🟠'
          : '🔴';
      }
    });
  }
}