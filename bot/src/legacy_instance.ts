/* eslint-disable init-declarations */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { World } from "./common/world";

let world: World;

/** @deprecated */
export const initialize = (value: World) => {
   world = value;
};

/** @deprecated */
export const getCollection = <T>(name: string) => Promise.resolve (world.mongodb.collection<T> (name));