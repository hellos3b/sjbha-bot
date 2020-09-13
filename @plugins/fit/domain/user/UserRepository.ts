import UserCollection from "../../db/UserCollection";
import { NotConnected } from "../../errors";
import User, { SerializedUser } from './User';
import Users from "./Users";

/** Get a user by their Discord ID */
export async function getUser(discordId: string) {
  const user = await UserCollection().findOne({discordId});
  if (!user) throw new NotConnected(`User with id '${discordId}' doesn't exist`);

  return User.createFromDb(user);
}

/** Get a user by their strava ID */
export async function getUserByStravaId(stravaId: string) {
  const user = await UserCollection().findOne({stravaId});
  if (!user) throw new NotConnected(`User with strava id '${stravaId}' doesn't exist`);

  return User.createFromDb(user);
}

/** Update the user. Will call $set and automatically convert object to dot notation */
export async function saveUser(user: User) {
  await updateUser(user.serialize())
}

export async function getAllUsers() {
  const users = await UserCollection().find().toArray();
  return Users.createFromDb(users);
}

async function updateUser(user: SerializedUser) {
  await UserCollection()
  .updateOne(
    {discordId: user.discordId},
    {$set: {
      gender  : user.gender,
      xp      : user.exp,
      maxHR   : user.maxHR,
      fitScore: user.fitScore
    }}
  )
}