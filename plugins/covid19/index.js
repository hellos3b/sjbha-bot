/**
 *  Use this as the base template for a new command
 *
 */

import Axios from "axios";
import deepmerge from "deepmerge";

async function getCountryStats(country) {
  const json = await Axios.get('https://pomber.github.io/covid19/timeseries.json')
  const search = Object.keys(json.data)
    .find(i => i.toLowerCase() === country.toLowerCase())

  if (!search) return null;

  const data = json.data[search]

  return {
    full: data,
    today: data[data.length - 1],
    yesterday: data[data.length - 2]
  }
}

const baseConfig = {
  command: "covid19",
};

export default function (bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt);

  return [
    {
      // Command to start it
      command: config.command,
      options: bastion.parsers.args(["country"]),

      // Core of the command
      resolve: async function (context) {
        const [, ...args] = context.message.split(" ")
        const country = args.join(" ")
        
        // Fetch data
        const countryString = country || 'US'
        const data = await getCountryStats(countryString)

        // If no data return
        if (!data) return `Country '${countryString}' data not found in JHU database.`;

        // get diffs
        const diffs = {
          confirmed: data.today.confirmed - data.yesterday.confirmed,
          deaths: data.today.deaths - data.yesterday.deaths,
          recovered: data.today.recovered - data.yesterday.recovered
        }

        return (
          `Currently in ${countryString} there are **${data.today.confirmed}** *(+${diffs.confirmed})* cases of COVID19, ` +
          `with **${data.today.deaths}** *(+${diffs.deaths})* deaths, ` +
          `and **${data.today.recovered}** *(+${diffs.recovered})* recoveries as of **${data.today.date}**`
        );
      },
    },
  ];
}
