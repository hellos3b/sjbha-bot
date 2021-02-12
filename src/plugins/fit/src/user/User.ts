import {server} from "@app/bastion";
import type { Member } from "@packages/bastion";
import {UserDTO, Users} from "../io/user-db";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import {pipe, flow} from "fp-ts/function";
import { createClient, StravaClient } from "../io/strava-client";
import { NotConnected } from "../errors";
import { Unauthorized } from "@packages/common-errors";

interface UserData {
  dto: UserDTO;
  member: Member;
}
export interface UnauthorizedUser {
  readonly _tag: "unauthorized user";
  readonly id: string;
};

export interface ConnectedUser {
  readonly _tag: "connected user";
  readonly id: string;
  readonly refreshToken: string;
  readonly member: Member;
};

export type User = UnauthorizedUser | ConnectedUser;

export const isUnauthorized = (user: User): user is UnauthorizedUser => user._tag === "unauthorized user";
export const isConnected = (user: User): user is ConnectedUser => user._tag === "connected user";

export const unauthorizedUser = (dto: UserDTO): User => ({
  _tag: "unauthorized user",
  id: dto.discordId
});

export const connectedUser = (dto: UserDTO, member: Member): User => ({
  _tag: "connected user",
  id: dto.discordId,
  refreshToken: dto.refreshToken,
  member
})

const fold = <T>(notConnected: (user: UnauthorizedUser) => T, connected: (user: ConnectedUser) => T) => {
  return (user: User) => isUnauthorized(user) ? notConnected(user) : connected(user);
}
  // // todo: User concern
  // const getToken = (user: UserDTO) => pipe(
  //   O.fromNullable(user.refreshToken),
  //   E.fromOption(Unauthorized.lazy("User does not have a refresh token"))
  // );