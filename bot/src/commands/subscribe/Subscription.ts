import { getCollection } from "../../legacy_instance";
import { Collection } from "mongodb";

export type subscription = {
  name: string;
  id  : string;
}

export const collection = () : Promise<Collection<subscription>> => getCollection<subscription> ("subscriptions");