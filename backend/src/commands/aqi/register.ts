import { onMessage } from '@sjbha/app';
import { channels } from '@sjbha/config';
import { restrictToChannel, startsWith } from '@sjbha/utils/message-middleware';

import { aqi } from './aqi';

onMessage (
  startsWith ('!aqi'),
  restrictToChannel (
    channels.shitpost, 
    'AQI command is limited to #shitpost' // todo: mention channel util
  ),
  aqi
);