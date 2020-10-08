import * as R from "ramda";

export const Sensors = {
  "Downtown San Jose" : [56013, 64381, 64881],
  "East San Jose"     : [20757, 64881, 56007],
  "South San Jose"    : [15245, 54205, 54205],
  "Santa Clara"       : [19313, 70615, 60819],
  "Mountain View"     : [38607, 62249, 60819],
  "San Mateo"         : [60115, 59143, 67283]
};

export const SensorIds = R.pipe (R.values, R.flatten) (Sensors);