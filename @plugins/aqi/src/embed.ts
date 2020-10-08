import type {SensorAverages} from "./parse";
import format from "string-format";

// Emojis are broken in text editor lol
const GREEN_CIRCLE = "🟢";
const YELLOW_CIRCLE = "🟡";
const ORANGE_CIRCLE = "🟠";
const RED_CIRCLE = "🔴";

const emoji = (aqi: number) => {
  if (aqi < 50) return GREEN_CIRCLE;
  if (aqi < 100) return YELLOW_CIRCLE;
  if (aqi < 150) return ORANGE_CIRCLE;
  return RED_CIRCLE;
}

const color = (aqi: number) => {
  if (aqi < 50) return 5564977;
  if (aqi < 100) return 16644115;
  if (aqi < 150) return 16354326;
  return 13309719;  
}

const locations = (records: {[name: string]: number}) => 
  Object.entries(records)
    .map (([name, aqi]) => format("{0} **{1}** {2}", emoji(aqi), name, String(aqi)))
    .join("\n");

export const create = (data: SensorAverages) => ({
  title: format("Air Quality Index • {0} average", String(data.average)),
  description: locations(data.locations),
  color: color(data.average),
  footer: {
    "text": "Based on a 10 minute average from Purple Air sensors"
  }
});