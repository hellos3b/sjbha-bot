import { Message, EmbedBuilder } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import * as R from 'ramda';

import * as format from '@sjbha/utils/Format';

import * as Exp from './Exp';
import * as User from './User';
import * as Workout from './Workout';

// Controls how wide the chart is
const CHART_SIZE = 15;

// Fit balance is a comparison between a user's moderate EXP
// and their vigorous EXP, where balanced would be moderate === vigorous
type balance =
  | 'lowAerobic'
  | 'aerobic'
  | 'balanced'
  | 'anerobic'
  | 'highAnerobic'

const color : Record<balance, number> = {
  lowAerobic:   0x2f72a2,
  aerobic:      0x33b3a7,
  balanced:     0x57c15a,
  anerobic:     0xd2891d,
  highAnerobic: 0xb73030
}

const label : Record<balance, string> = {
  lowAerobic:   'Low Aerobic',
  aerobic:      'Aerobic',
  balanced:     'Balanced',
  anerobic:     'Anerobic',
  highAnerobic: 'High Anerobic'
};

const aerobic : balance[] = ['lowAerobic', 'aerobic'];
const anerobic : balance[] = ['anerobic', 'highAnerobic'];

// Repeat a string for x number
const repeat = (str: string, x: number) => 
  (x > 0)
    ? new Array (x).fill (str).join ('')
    : '';

// Draws a horizontal chart that looks like `| <<< + >>> |`
const drawChart = (leftPercent: number, rightPercent: number) : string => {
  const leftArrowCount = Math.floor (leftPercent * CHART_SIZE);
  const rightArrowCount = Math.floor (rightPercent * CHART_SIZE);
  
  let chart = '';
  chart += '|';
  chart += repeat ('<', leftArrowCount).padStart (CHART_SIZE);
  chart += '+';
  chart += repeat ('>', rightArrowCount).padEnd (CHART_SIZE);
  chart += '|';
  return chart;
}


export const render = async (message: Message) : Promise<void> => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t set up with the Strava bot');
    return;
  }

  const last14Days = Interval.before (DateTime.local (), { days: 14 });
  const workouts = await Workout.find ({
    ...Workout.recordedBy (user.discordId),
    ...Workout.during (last14Days)
  });

  const hrExp = workouts
    .map (w => w.exp)
    .filter (Exp.isHr);

  if (hrExp.length < 4) {
    message.reply (`You need at least 4 heartrate workouts in the last 2 weeks to check your balance. You have **${hrExp.length}**`);
    return;
  }

  // Total Moderate exp 
  const moderate = hrExp.map (hr => hr.moderate).reduce (R.add, 0);
  // Total Vigorous exp
  const vigorous = hrExp.map (hr => hr.vigorous).reduce (R.add, 0);
  // What % of exp was in moderate range
  const moderatePercent = moderate / (moderate + vigorous);
  // Balance score from 0 - 200 where 0 = all moderate and 200 = all vigorous
  const absoluteScore = 200 - (moderatePercent * 200);
  // Balance score shifted so balanced is at 0, -100 is all moderate, and 100 is all vigorous
  const relativeScore = absoluteScore - 100;
  // Absolute value the balance is from 0
  const offCenter = Math.abs (relativeScore);
  // How off center the balance is from 0-1
  const offCenterNormalized = offCenter / 100;

  const balance : balance =
    (absoluteScore < 50) ? 'lowAerobic' :
    (absoluteScore < 90) ? 'aerobic' :
    (absoluteScore <= 110) ? 'balanced' :
    (absoluteScore < 150) ? 'anerobic' :
    'highAnerobic';

  const scoreText = 
    (relativeScore > 0) 
    ? '+' + Math.floor (relativeScore)
    : Math.floor (relativeScore);

  const chart =
    aerobic.includes (balance) ? drawChart (offCenterNormalized, 0) : 
    anerobic.includes (balance) ? drawChart (0, offCenterNormalized) : 
    drawChart (0, 0);

  const embed = new EmbedBuilder ({
    color:       color[balance],
    title:       `${label[balance]} (${scoreText})`,
    description: format.inlineCode (chart),
    fields:      [
      { name: 'Moderate', value: moderate.toFixed (1), inline: true },
      { name: 'Vigorous', value: vigorous.toFixed (1), inline: true }
    ]
  });

  message.channel.send ({ embeds: [embed] });
}