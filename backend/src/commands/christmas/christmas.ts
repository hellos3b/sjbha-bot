import { env, MessageHandler } from '@sjbha/app';
import { DateObjectUnits, DateTime } from 'luxon';

const festivize = (msg: string) => `🎄☃️☃️🎄🎁 ${msg} 🎁🎄☃️☃️🎄`;
const pluralize = (word: string, count: number) => word + (count === 1 ? '' : 'S');

const resetTime : DateObjectUnits = {
  hour: 0, minute: 0, second: 0, millisecond: 0
};

export const christmas : MessageHandler = message => {
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

  const daysLeft = Math.floor (diff.days);

  const reply = (daysLeft === 0) 
    ? festivize ('!!TODAY IS CHRISTMAS!!')
    : festivize (`ONLY ${daysLeft} ${pluralize ('DAY', daysLeft)} UNTIL CHRISTMAS!!`);

  message.channel.send (reply);
};