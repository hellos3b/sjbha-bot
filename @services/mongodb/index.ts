export {default as Collection} from "./Collection"

import {getCollection, db} from "./connection";
export {getCollection, db};
// back compat cuz i changed things
export default {getCollection};