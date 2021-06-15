import { MessageHandler, MessageEmbed } from '@sjbha/app';
import { DateTime, Interval } from 'luxon';
import * as R from 'ramda';
import { isOfVariant, isType, lookup, variantList } from 'variant';

import * as format from '@sjbha/utils/string-formatting';

import * as User from '../db/user';
import { Workouts, Exp } from '../db/workout';

/** Controls how wide the chart is */
const CHART_SIZE = 15;

const Balance = variantList ([
  'lowAerobic',
  'aerobic',
  'balanced',
  'anerobic',
  'highAnerobic'
]);

const Aerobic = variantList ([Balance.lowAerobic, Balance.aerobic]);
const Anerobic = variantList ([Balance.anerobic, Balance.highAnerobic]);

export const balance : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t set up with the Strava bot');

    return;
  }

  const last14Days = Interval.before (DateTime.local (), { days: 14 });
  const workouts = await Workouts ()
    .recordedBy (user.discordId)
    .during (last14Days)
    .find ();

  const hrExp = workouts
    .map (w => w.exp)
    .filter (isType (Exp.hr));

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

  const balance =
    (absoluteScore < 50)      ? Balance.lowAerobic ()
    : (absoluteScore < 90)    ? Balance.aerobic ()
    : (absoluteScore <= 110)  ? Balance.balanced ()
    : (absoluteScore < 150)   ? Balance.anerobic ()
    : Balance.highAnerobic ();

  const embed = new MessageEmbed ();

  embed.setColor (lookup (balance, {
    lowAerobic:   0x2f72a2,
    aerobic:      0x33b3a7,
    balanced:     0x57c15a,
    anerobic:     0xd2891d,
    highAnerobic: 0xb73030
  }));

  const balanceName = lookup (balance, {
    lowAerobic:   'Low Aerobic',
    aerobic:      'Aerobic',
    balanced:     'Balanced',
    anerobic:     'Anerobic',
    highAnerobic: 'High Anerobic'
  });

  const scoreText = (relativeScore > 0) 
    ? '+' + Math.floor (relativeScore)
    : Math.floor (relativeScore);

  embed.setTitle (`${balanceName} (${scoreText})`);

  const chart =
    (isOfVariant (balance, Aerobic))    ? drawChart (offCenterNormalized, 0)
    : (isOfVariant (balance, Anerobic)) ? drawChart (0, offCenterNormalized)
    : drawChart (0, 0);

  embed.setDescription (format.inlineCode (chart));
  embed.addField ('Moderate', moderate.toFixed (1), true);
  embed.addField ('Vigorous', vigorous.toFixed (1), true);

  message.channel.send (embed);
}

/**
 * Repeat a string for x number
 * 
 * @param str The string to repeat
 * @param count How many you want
 */
const repeat = (str: string, x: number) => {
  if (x === 0)
    return '';
  
  return new Array (x).fill (str).join ('');
}

/**
 * Draws a horizontal chart that looks like `| <<< + >>> |`
 * 
 * @param leftPercent How far the left arrows should go from 0-1
 * @param rightPercent How far the right arrows should go from 0-1
 * @returns A string chart, wrapped as a codeblock
 */
const drawChart = (leftPercent: number, rightPercent: number) : string => {
  let chart = '';

  const leftArrowCount = Math.floor (leftPercent * CHART_SIZE);
  const rightArrowCount = Math.floor (rightPercent * CHART_SIZE);
  
  chart += '|';
  chart += repeat ('<', leftArrowCount).padStart (CHART_SIZE);
  chart += '+';
  chart += repeat ('>', rightArrowCount).padEnd (CHART_SIZE);
  chart += '|';

  return chart;
}