import * as Command from '@sjbha/utils/Command';
import { channels } from '@sjbha/config';

import { aqi } from './aqi';

export const command = Command.makeFiltered ({
  filter: Command.Filter.and (
    Command.Filter.startsWith ('!aqi'),
    Command.Filter.inChannel (
      channels.shitpost,
      'AQI Command is limited to #shitpost'
    )
  ),

  callback: aqi
});