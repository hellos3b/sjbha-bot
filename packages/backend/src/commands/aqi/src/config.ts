const DTSJ = "Downtown San Jose";
const ESJ = "East San Jose";
const SSJ = "South San Jose";
const SC = "Santa Clara";
const MV = "Mountain View";
const SM = "San Mateo";

const sensors = [
  {id: 56013, location: DTSJ},
  {id: 64381, location: DTSJ},
  {id: 64881, location: DTSJ},
  {id: 20757, location: ESJ},
  {id: 64881, location: ESJ},
  {id: 56007, location: ESJ},
  {id: 15245, location: SSJ},
  {id: 54205, location: SSJ},
  {id: 54205, location: SSJ},
  {id: 19313, location: SC},
  {id: 70615, location: SC},
  {id: 60819, location: SC},
  {id: 38607, location: MV},
  {id: 62249, location: MV},
  {id: 60819, location: MV},
  {id: 60115, location: SM},
  {id: 59143, location: SM},
  {id: 67283, location: SM}
];

export const locations = [DTSJ, ESJ, SSJ, SC, MV, SM];

export const sensorIds = sensors.map(_ => _.id);

export const sensorsByLocation = (location: string) : number[] => 
  sensors.filter (source => source.location === location)
    .map (source => source.id);