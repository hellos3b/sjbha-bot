import { DateTime, Duration, Interval } from 'luxon';

// A week is an interval that starts on Monday at 1am
// This method is for finding that timestamp based on any date
const getStartOfWeek = (date: DateTime) => {
  // If the timestamp is on Sunday, use the previous monday
  if (date.weekday === 0) {
    return date
      .minus ({ day: 6 })
      .set ({ hour: 1, minute: 0, second: 0 });
  }
  
  // We leak into monday at 1am
  if (date.weekday === 1 && date.hour <= 1) {
    return date.set ({ weekday: 1, hour: 1, minute: 0, second: 0 });      
  }

  return date
    .set ({ weekday: 1 })
    .set ({ hour: 1, minute: 0, second: 0 });  
}

const weekFromDate = (date: DateTime) : Interval => 
  Interval.after (
    getStartOfWeek (date),
    Duration.fromObject ({ days: 7 })
  );

export const current = () : Interval => 
  weekFromDate (DateTime.local ());

export const previous = () : Interval =>
  weekFromDate (DateTime.local ().minus ({ days: 7 }));
