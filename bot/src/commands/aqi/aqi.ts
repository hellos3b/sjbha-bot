import * as Command from '@sjbha/Command';
import { channels } from '@sjbha/server';
import * as Filter from '@sjbha/CommandFilter';
import * as DiscordJs from 'discord.js';
import * as PurpleAir from './purpleair';

const aqi = async (message: DiscordJs.Message): Promise<void> => {
  const sensors = await PurpleAir.SensorCollection.fetchIds(PurpleAir.sensorIds);
  const aqi = sensors.getAverageAqi();

  const locations = PurpleAir.locations.map(name => {
    const ids = PurpleAir.sensorsByLocation(name);
    const aqi = sensors.filter(ids).getAverageAqi();

    const emoji = {
      good: '🟢',
      sketchy: '🟡',
      bad: '🟠',
      terrible: '🔴'
    }[aqi.level];

    return `${emoji} **${name}** ${aqi}`;
  });

  const embed = new DiscordJs.MessageEmbed()
    .setTitle(`Air quality Index • ${aqi} average`)
    .setColor({
      good: 5564977,
      sketchy: 16644115,
      bad: 16354326,
      terrible: 13309719
    }[aqi.level])
    .setDescription(locations.join('\n'))
    .setFooter('Based on a 10 minute average from Purple Air sensors');

  message.channel.send({ embeds: [embed] });
}

export const command = Command.filtered({
  filter: Filter.and(
    Filter.startsWith('!aqi'),
    Filter.inChannel(
      channels.shitpost,
      'AQI Command is limited to #shitpost'
    )
  ),

  callback: aqi
});