/* eslint-disable init-declarations */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { World } from "../world";

let world: World;

/** @deprecated */
export const initialize = (value: World) => {
   world = value;
};

export const getInstance = () => world;

/** @deprecated */
export const getCollection = <T>(name: string) => Promise.resolve (world.mongodb.collection<T> (name));