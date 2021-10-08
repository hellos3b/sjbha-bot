import { Message, MessageEmbed } from 'discord.js';
import { lookup } from 'variant';

import * as Config from './config';
import * as PurpleAir from './purpleair';

export async function aqi (message: Message) : Promise<void> {
  const sensors = await PurpleAir.SensorCollection.fetchIds (Config.sensorIds);
  const aqi = sensors.getAverageAqi ();

  const locations = Config.locations.map (name => {
    const ids = Config.sensorsByLocation (name);
    const aqi = sensors.filter (ids).getAverageAqi ();

    const emoji = lookup (aqi.level, {
      good:     '🟢',
      sketchy:  '🟡',
      bad:      '🟠',
      terrible: '🔴'
    });

    return `${emoji} **${name}** ${aqi}`;
  });

  const embed = new MessageEmbed ()
    .setTitle (`Air quality Index • ${aqi} average`)
    .setColor (lookup (aqi.level, {
      good:     5564977,
      sketchy:  16644115,
      bad:      16354326,
      terrible: 13309719
    }))
    .setDescription (locations.join ('\n'))
    .setFooter ('Based on a 10 minute average from Purple Air sensors');

  message.channel.send (embed);
}