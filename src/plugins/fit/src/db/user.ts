import {Codec, string, number, GetType} from "purify-ts";
import {collection} from "@shared/collection";

export const UserDTO = Codec.interface({
  discordId: string,
  password: string,
  stravaId: string,
  refreshToken: string,
  gender: string,
  maxHR: number,
  xp: number,
  fitScore: number
})

export type UserDTO = GetType<typeof UserDTO>;
export const Users = collection('fit-users', UserDTO);


// export const userCollection = collection<UserSchema>('fit-users', {
//   discordId   : "",
//   stravaId    : "",
//   password    : "",
//   refreshToken: "",
//   gender      : "",
//   maxHR       : 0,
//   xp          : 0,
//   fitScore    : 0
// });
 
// const guaranteeUserExists = (user: UserSchema|null): F.FutureInstance<ErrorT, UserSchema> => 
//   !!user ? F.resolve(user) : F.reject(missingUser());

// const asAuthorized = (password: string) => (user: UserSchema) =>
//   (user.password === password)
//     ? F.resolve(<Authorized>user) 
//     : F.reject(unauthorized());

// export const insertNewUser = R.pipe(
//   newUser, 
//   collection.insertOne
// );

// export const getById = (id: string) => R.pipe(
//   () => collection.findOne({discordId: id}),
//   F.chain (guaranteeUserExists),
//   F.map (withDefaults)
// )();

// export const getAll = () => R.pipe(
//   () => collection.find(),
//   F.map (R.map (withDefaults))
// )();

// export const getOrCreate = (id: string) => R.pipe(
//   getById,
//   F.chainRej (() => insertNewUser(id)) 
// )(id)

// export const getAuthorized = (auth: Auth) => R.pipe(
//   () => getById (auth.discordId),
//   F.chain (asAuthorized (auth.password))
// )();

// export const update = (user: Authorized) => 
//   collection.replaceOne({discordId: user.discordId})(user);