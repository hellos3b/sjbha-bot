import { Message$ } from '@sjbha/app';
import { channels } from '@sjbha/config';

import { aqi } from './aqi';

Message$
  .startsWith ('!aqi')
  .restrictToChannel (
    channels.shitpost, 
    'AQI command is limited to #shitpost' // todo: mention channel util
  )
  .subscribe (aqi)