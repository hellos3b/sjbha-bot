import { Codec, GetType, string, number } from 'purify-ts';
import { db } from '@sjbha/app';

export const User = Codec.interface ({
  discordId:    string,
  password:     string,
  stravaId:     number,
  refreshToken: string,
  gender:       string,
  maxHR:        number,
  xp:           number,
  fitScore:     number
});

export type User = GetType<typeof User>;

export const Users = db<User> ('fit-users');