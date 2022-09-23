import { env } from '../app';

const production = {
  // Fitness related emojis
  certified_swole: '748958684897476722',
  max_effort:      '748958651506491413',
  break_a_sweat:   '748958591687589938'
};

type Roles = typeof production;

const development: Roles = {
  certified_swole: '748684449209647177',
  max_effort:      '748692268642336829',
  break_a_sweat:   '748684543497601065',
};

export const roles = env.IS_PRODUCTION ? production : development;