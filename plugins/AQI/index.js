import { convert, getPollutantMeta } from "@shootismoke/convert";
import Axios from "axios";

const Sensors = [
  { name: "Downtown San Jose", id: 56013},
  { name: "East San Jose", id: 20757},
  { name: "South San Jose", id: 15245},
  { name: "Santa Clara", id: 19313},
  { name: "Mountain View", id: 38607},
  { name: "San Mateo", id: 60115}
];

const IDS = Sensors.map(i => i.id).join("|");
const API = `https://www.purpleair.com/json?show=${IDS}`;

// Emojis are broken lol
const GREEN_CIRCLE = "🟢";
const YELLOW_CIRCLE = "🟡";
const ORANGE_CIRCLE = "🟠";
const RED_CIRCLE = "🔴";

export default function(bastion, opt={}) {
  return [

    {
      command: "aqi",

      resolve: async function(context) {
        const res = await Axios.get(API);
        const data = res.data.results;

        let msg = "";
        let total_aqi = 0;
        for (var i = 0; i < Sensors.length; i++) {
          const sensor = Sensors[i];
          const purp = data.find(i => i.ID === sensor.id && !i.ParentID);
          const aqi = getAQI(purp);

          total_aqi += aqi;
          const circle = getEmoji(aqi)
          msg += `${circle} **${sensor.name}:** ${aqi}\n`
        }

        const average_aqi = total_aqi / Sensors.length;
        const color = getColor(average_aqi);

        const embed = {
          "title": "Air Quality Index • " + average_aqi.toFixed(0) + " average",
          "description": msg,
          "color": color,
          "footer": {
            "text": "Based on a 10 minute average from Purple Air sensors"
          }
        };

        bastion.bot.sendMessage({
          to: context.channelID,
          embed
        })
      }
    }
  ]
}

const getColor = (average_aqi) => {
  if (average_aqi < 50) return 5564977;
  if (average_aqi < 100) return 16644115;
  if (average_aqi < 150) return 16354326;
  return 13309719;  
}

const getEmoji = (aqi) => {
  if (aqi < 50) return GREEN_CIRCLE;
  if (aqi < 100) return YELLOW_CIRCLE;
  if (aqi < 150) return ORANGE_CIRCLE;
  return RED_CIRCLE;
}

const getAQI = (data) => {
  const stats = JSON.parse(data["Stats"]);
  const tenMinPM = stats.v1;

  const res = convert('pm25', 'raw', 'usaEpa', tenMinPM);

  console.log("Res?", res);
  return res;
}

/*

PURPLE AIR API:

"ID":1234, // PurpleAir sensor ID
"ParentID":null, // The PurpleAir sensor ID of the "parent" entry in the case of Channel B
"THINGSPEAK_PRIMARY_ID":"1234", // The Thingspeak channel ID for primary data of this sensor
"THINGSPEAK_PRIMARY_ID_READ_KEY":"XXXX", // The Thingspeak read key for primary data of this sensor
"Label":"name", // The "name" that appears on the map for this sensor
"Lat":null, // Latitude position info
"Lon":null, // Longitude position info
"PM2_5Value":"1.07", // Current PM2.5 value (based on the
"State":null,  // Unused variable
"Type":"TYPE",  // Sensor type (PMS5003, PMS1003, BME280 etc)
"Hidden":"true", // Hide from public view on map: true/false
"Flag":null, // Data flagged for unusually high readings
"DEVICE_BRIGHTNESS":"1", // LED brightness (if hardware is present)
"isOwner":1, // Currently logged in user is the sensor owner
"A_H":null, // true if the sensor output has been downgraded or marked for attention due to suspected hardware issues
"temp_f":"xx",  // Current temperature in F
"humidity":"xx", // Current humidity in %
"pressure":"xx", // Current pressure in Millibars
"AGE":29831, // Sensor data age (when data was last received) in minutes
"THINGSPEAK_SECONDARY_ID":"1234", // The Thingspeak channel ID for secondary data of this sensor
"THINGSPEAK_SECONDARY_ID_READ_KEY":"XXXX", // The Thingspeak read key for secondary data of this sensor
"LastSeen":1490309930, // Last seen data time stamp in UTC
"Version":"2.47c", // Current version of sensor firmware
"LastUpdateCheck":1490308331, // Last update checked at time stamp in UTC
"Uptime":"5210", // Sensor uptime in seconds
"RSSI":"-68", // Sensor's WiFi signal strength in dBm

"Stats": // Statistics for PM2.5

"{
\"v\":1.07, // Real time or current PM2.5 Value
\"v1\":1.3988595758168765, // Short term (10 minute average)
\"v2\":10.938131480857114, // 30 minute average
\"v3\":15.028685608345926, // 1 hour average
\"v4\":6.290537580116773, // 6 hour average
\"v5\":1.8393146177050788, // 24 hour average
\"v6\":0.27522764912064507, // One week average
\"pm\":1.07, // Real time or current PM2.5 Value
\"lastModified\":1490309930933, // Last modified time stamp for calculated average statistics
\"timeSinceModified\":69290 // Time between last two readings in milliseconds
}"
}

 */