// import {Codec, string, number, GetType} from "purify-ts";
import * as t from "io-ts";

import {collection} from "@shared/collection";

export const UserDTO = t.interface({
  discordId: t.string,
  password: t.string,
  stravaId: t.string,
  refreshToken: t.string,
  gender: t.string,
  maxHR: t.number,
  xp: t.number,
  fitScore: t.number
})

export type UserDTO = t.TypeOf<typeof UserDTO>;
export const Users = collection('fit-users', UserDTO);

// const user = (dto: UserDTO) => pipe(
//   server.getMember(dto.discordId),
//   TE.map((member): User => {
//     if (!dto.refreshToken) return unauthorizedUser(dto);
//     return connectedUser(dto, member);
//   })
// )



// const getClient = fold(
//   () => TE.left(NotConnected.create("")),
//   user => createClient(user.refreshToken)
// );

// export const getUserById = (id: string) => pipe(
//   Users.findOne({discordId: id}),
//   TE.chain(user)
// );