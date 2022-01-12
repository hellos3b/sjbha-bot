import * as Command from '@sjbha/utils/Command';
import { env } from '@sjbha/app';
import { match, __ } from 'ts-pattern';
import { DateObjectUnits, DateTime } from 'luxon';

const festivize = (msg: string) => `🎄☃️☃️🎄🎁 ${msg} 🎁🎄☃️☃️🎄`;
const pluralize = (word: string, count: number) => word + (count === 1 ? '' : 'S');

const resetTime : DateObjectUnits = {
  hour: 0, minute: 0, second: 0, millisecond: 0
};

const daysUntilChristmas = () => {
  const now = DateTime
    .local ()
    .setZone (env.TIME_ZONE)
    .set (resetTime);

  const xmas = DateTime
    .local ()
    .setZone (env.TIME_ZONE)
    .set ({ ...resetTime, month: 12,  day: 25 });

  let diff = xmas.diff (now, 'days');

  // If it's already passed xmas, use next year's christmas
  if (diff.days < 0) {
    diff = xmas
      .set ({ year: now.year + 1 })
      .diff (now, 'days');
  }

  return Math.floor (diff.days);
}

export const command = Command.makeFiltered ({
  filter:   Command.Filter.startsWith ('!christmas'),
  callback: message => {
    const reply = match (daysUntilChristmas ())
      .with (0, () => festivize ('!!TODAY IS CHRISTMAS!!'))
      .with (__, val => `ONLY ${val} ${pluralize ('DAY', val)} UNTIL CHRISTMAS!!`)
      .exhaustive ();

    message.channel.send (reply);
  }
});