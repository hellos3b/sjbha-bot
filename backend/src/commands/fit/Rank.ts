import * as R from 'ramda';

const ranks = [
  'Hummingbird', 
  'Goldfinch', 
  'Thrasher',
  'Kingfisher', 
  'Peregrine Falcon', 
  'Golden Eagle'
];

const none = 'Bushtit';

export const fromScore = (score: number) : string => {
  if (score === 0)
    return none;

  // Each rank is 20 points
  const rankLevel = Math.floor (score / 20);
  const index = R.clamp (0, ranks.length, rankLevel);
  const rank = ranks[index];

  // Each rank is split into quarters represented by division
  const remainder = score % 20;
  const division = 
    (remainder < 5) ? 'I' : 
    (remainder < 10) ? 'II' : 
    (remainder < 15) ? 'III' : 
    'IV';
  
  return rank + ' ' + division;
}