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
      resolve: async function (context, country) {
        // Fetch data
        const countryString = country || 'US'
        const data = await getCountryStats(countryString)

        // If no data return
        if (!data) return `Country '${countryString}' data not found in JHU database.`;

        // get diffs
        const cdiff = data.today.confirmed - data.yesterday.confirmed;
        const ddiff = data.today.deaths - data.yesterday.deaths;
        const rdiff = data.today.recovered - data.yesterday.recovered;

        return (
          `Currently in ${countryString} there are **${data.today.confirmed}** *(+${cdiff})* cases of COVID19, ` +
          `with **${data.today.deaths}** *(+${ddiff})* deaths, ` +
          `and **${data.today.recovered}** *(+${rdiff})* recoveries as of ${data.today.date}`
        );
      },
    },
  ];
}
