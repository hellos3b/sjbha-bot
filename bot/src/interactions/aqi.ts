import { convert } from "@shootismoke/convert";
import { ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import superagent from "superagent";
import { Result, Option } from "@swan-io/boxed";
import { interactionFailed } from "../errors";
import { just } from "../util";
import { mean } from "../util_math";
import { unique } from "../util_array";

type source = [sensorId: string, location: string];

interface apiStats {
   v1: number;
}

interface apiSensor {
   ParentID?: string;
   ID: string;
   // stringified 'apiStats'
   Stats: string;
}

interface apiResponse {
   results: apiSensor[];
}

interface sensor {
   location: string;
   aqi: number;
}

enum Quality {
   Good,
   Sketchy,
   Bad,
   Terrible
}

const downtown = "Downtown San Jose";
const eastSanJose = "East San Jose";
const southSanJose = "South San Jose";
const santaClara = "Santa Clara";
const mountainView = "Mountain View";
const sanMateo = "San Mateo";

const locations = [downtown, eastSanJose, southSanJose, santaClara, mountainView, sanMateo];

const sources: source[] = [ 
   ["56013", downtown],
   ["64381", downtown],
   ["20757", eastSanJose],
   ["64881", eastSanJose],
   ["56007", eastSanJose],
   ["15245", southSanJose],
   ["54205", southSanJose],
   ["19313", santaClara],
   ["70615", santaClara],
   ["60819", santaClara],
   ["38607", mountainView],
   ["62249", mountainView],
   ["60819", mountainView],
   ["60115", sanMateo],
   ["59143", sanMateo],
   ["67283", sanMateo],
];

const sourceId = (source: source) => source[0];

const sourceLocation = (source: source) => source[1];

const pm25ToAqi = (pm25: number) => convert ("pm25", "raw", "usaEpa", pm25);

const sensorId = (sensor: apiSensor) => sensor.ParentID ?? sensor.ID;

const sensorAqi = (sensor: apiSensor) =>
   Result
      .fromExecution (() => JSON.parse (sensor.Stats) as apiStats)
      .map (it => pm25ToAqi (it.v1))
      .getWithDefault (-1);

const quality = (aqi: number) => {
   switch (true) {
      case aqi < 50: return Quality.Good;
      case aqi < 100: return Quality.Sketchy;
      case aqi < 150: return Quality.Bad;
      default: return Quality.Terrible;
   }
};

const parseApiSensor = (sensor: apiSensor): sensor => ({
   location: Option
      .fromNullable (sources.find (it => sourceId (it) === sensorId (sensor)))
      .map (sourceLocation)
      .getWithDefault ("missing"),
   aqi: sensorAqi (sensor)
});

const borderColor = (quality: Quality): number => {
   switch (quality) {
      case Quality.Good: return 5564977;
      case Quality.Sketchy: return 16644115;
      case Quality.Bad: return 16354326;
      case Quality.Terrible: return 13309719;
   }
};

const icon = (quality: Quality): string => {
   switch (quality) {
      case Quality.Good: return "🟢";
      case Quality.Sketchy: return "🟡";
      case Quality.Bad: return "🟠";
      case Quality.Terrible: return "🔴";
   }
};

const apiFailedReply: InteractionReplyOptions = {
   content: "👻 Not able to get the sensor data"
};

const makeAqiReply = (apiSensors: apiSensor[]): InteractionReplyOptions => {
   const sensors = apiSensors
      .map (parseApiSensor)
      .filter (it => it.aqi < 0);

   const average = mean (sensors.map (it => it.aqi));

   return {
      embeds: [{
         title: `Air Quality Index • ${average} average`,
         color: borderColor (quality (average)),
         description: locations
            .map (location => [location, sensors.filter (it => it.location === location)] as const)
            .map (([loc, sensors]) => {
               const aqi = mean (sensors.map (it => it.aqi));
               return `${icon (aqi)} **${loc}** ${aqi}`;
            })
            .join ("\n"),
         footer: { text: "Based on a 10 minute average from [these Purple Air sensors](https://www.google.com)" }
      }]
   };
};

const fetchSensors = (ids: string[]): Promise<apiSensor[]> =>
   superagent
      .get ("https://www.purpleair.com/json")
      .timeout (2500)
      .query ({ show: ids.join ("|") })
      .then (it => (<apiResponse>it.body).results);

export const aqi = (interaction: ChatInputCommandInteraction): void => {
   const ids = sources.map (sourceId);
   const reply = fetchSensors (ids)
      .then (makeAqiReply)
      .catch (just (apiFailedReply));

   reply.then (_ => interaction.reply (_), interactionFailed);
};