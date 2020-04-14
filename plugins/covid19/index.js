/**
 *  Use this as the base template for a new command
 *
 */

import Axios from "axios";
import deepmerge from "deepmerge";

function capitalizeWords(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

async function getCountryStats(country) {
  const {data} = await Axios.get('https://pomber.github.io/covid19/timeseries.json')
  const countryData = data[country]

  if (!countryData) return null;

  return {
    full: countryData,
    today: countryData[countryData.length - 1],
    yesterday: countryData[countryData.length - 2]
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
        const countryString = capitalizeWords(country) || 'US'
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
