import { db } from '@sjbha/app';

export const Users = db<User> ('fit-users');

export type User = {
  discordId:    string;
  password:     string;
  stravaId:     number;
  refreshToken: string;
  gender:       string;
  maxHR:        number;
  xp:           number;
  fitScore:     number;
}