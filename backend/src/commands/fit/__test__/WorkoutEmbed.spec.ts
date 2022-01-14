import * as Workout from '../Workout';
import * as Exp from '../Exp';
import * as WorkoutEmbed from '../WorkoutEmbed';

const workout1 : Workout.workout = {
  __version:     1,
  activity_id:   1,
  message_id:    '1',
  discord_id:    'myself',
  activity_name: 'Tennis',
  timestamp:     '2022-01-12T01:14:33Z',
  activity_type: 'Workout',
  exp:           Exp.hr (10, 20)
};

const workout2 : Workout.workout = {
  __version:     1,
  activity_id:   2,
  message_id:    '2',
  discord_id:    'myself',
  activity_name: 'Strength',
  timestamp:     '2022-01-13T21:33:56Z',
  activity_type: 'WeightTraining',
  exp:           Exp.hr (5, 0)
};

const workout3 : Workout.workout = {
  __version:     1,
  activity_id:   3,
  message_id:    '',
  discord_id:    'myself',
  activity_name: 'Treadmill',
  timestamp:     '2022-01-13T22:18:51Z',
  activity_type: 'Walk',
  exp:           Exp.time (20)
};

describe ('fit/ActivityEmbed', () => {
  describe ('expSoFar', () => {
    it ('sums exp of all activities', () => {
      const recordedAlready = [workout1, workout2];
      const exp = WorkoutEmbed.expSoFar (workout3, recordedAlready);
      const expected = Exp.sum ([workout1, workout2, workout3].map (w => w.exp));

      expect (exp).toEqual (expected);
    });

    it ('doesnt include workouts that were posted later', () => {
      const recordedAlready = [workout1, workout2, workout3];
      const exp = WorkoutEmbed.expSoFar (workout2, recordedAlready);
      const expected = Exp.sum ([workout1, workout2].map (w => w.exp));

      expect (exp).toEqual (expected);
    });
  });
})