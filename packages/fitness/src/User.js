/**
 * @typedef {Object} UnauthorizedUser
 * @prop {String} discordId
 * @prop {String} authToken
 */

/**
 * @typedef {Object} User
 * @prop {String} discordId
 * @prop {String} authToken
 * @prop {number} stravaId
 * @prop {string} refreshToken
 */

/** @returns {import("mongodb").Collection<UnauthorizedUser | User>} */
export const userCollection = (mongo) => mongo.collection("fit-users");
