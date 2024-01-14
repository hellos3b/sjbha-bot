/**
 * @typedef {Object} LoggedWorkout
 * @prop {String} discordId
 * @prop {String} activityId
 * @prop {String} insertedDate
 * @prop {String} [messageId]
 * @prop {String} name
 * @prop {Number} exp
 * @prop {Boolean} expFromHR
 */

/** @returns {import("mongodb").Collection<LoggedWorkout>} */
export const loggedWorkoutCollection = (db) => db.collection("fit-workout");
