import bastion from "@app/bastion";
import type { Member } from "@packages/bastion";
import {UserDTO, Users} from "../io/user-db";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";
import { createClient, StravaClient } from "../io/strava-client";
import { NotConnected } from "../errors";
import { Unauthorized } from "@packages/common-errors";

export interface UnauthorizedUser {
  readonly _tag: "unauthorized";
  readonly id: string;
};

export interface ConnectedUser {
  readonly _tag: "connected";
  readonly id: string;
  readonly refreshToken: string;
  readonly member: Member;
};

export type User = UnauthorizedUser | ConnectedUser;

export const isUnauthorized = (user: User): user is UnauthorizedUser => user._tag === "unauthorized";
export const isConnected = (user: User): user is ConnectedUser => user._tag === "connected";

export const unauthorizedUser = (dto: UserDTO): User => ({
  _tag: "unauthorized",
  id: dto.discordId
});

export const connectedUser = (dto: UserDTO): User => ({
  _tag: "connected",
  id: dto.discordId,
  refreshToken: dto.refreshToken,
  member: member(dto)
})

export const fromDTO = (dto: UserDTO) => 
  (!dto.refreshToken) ? unauthorizedUser(dto) : connectedUser(dto);

const fold = <T>(notConnected: (user: UnauthorizedUser) => T, connected: (user: ConnectedUser) => T) => {
  return (user: User) => isUnauthorized(user) ? notConnected(user) : connected(user);
}

const getClient = fold(
  () => TE.left(NotConnected.create("")),
  user => createClient(user.refreshToken)
);

const member = (dto: UserDTO) => bastion.server.member(dto.discordId);

export const getUserById = (id: string) => pipe(
  Users.findOne({discordId: id}),
  TE.bindTo("dto"),
  TE.bind("member", )
  TE.map(fromDTO)
);


// // todo: User concern
// const getToken = (user: UserDTO) => pipe(
//   O.fromNullable(user.refreshToken),
//   E.fromOption(Unauthorized.lazy("User does not have a refresh token"))
// );