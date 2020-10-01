import UserCollection from "../../db/UserCollection";
import { Unauthorized, NotConnected } from "../../utils/errors";
import Auth from "./Auth";

/** Get a user by their Discord ID */
export async function getAuthById(discordId: string) {
  const user = await UserCollection().findOne({discordId});
  if (!user) throw new NotConnected(`User with id '${discordId}' doesn't exist`);

  return Auth.fromDb(user);
}

export async function getAuthorizedUser(discordId: string, password: string) {
  const user = await getAuthById(discordId);

  if (user.password !== password) {
    throw new Unauthorized("Invalid user account")
  }

  return user;
}


export async function getOrInitializeUser(discordId: string) {
  try {
    const user = await getAuthById(discordId);
    return user;
  } catch (e) {
    if (e.name === NotConnected.type) {
      const user = await initializeUser(discordId);
      return user;
    } else {
      throw e;
    }
  }
}

/** Create a new user */
export async function initializeUser(discordId: string) {
  const exists = await UserCollection().findOne({discordId});
  
  if (exists) {
    throw new Error(`Can't insert new user; user with discord id ${discordId} already exists`)
  }

  const auth = Auth.init(discordId)

  // else, make it!
  await UserCollection().updateOne(
    {discordId},
    {$set: {
      discordId,
      password: auth.password
    }},
    {upsert: true}
  );

  return auth;
}

/** Update the user. Will call $set and automatically convert object to dot notation */
export async function saveAuth(auth: Auth) {
  await UserCollection()
    .updateOne(
      {discordId: auth.id},
      {$set: {
        stravaId: auth.stravaId,
        refreshToken: auth.refreshToken
      }}
    )
}