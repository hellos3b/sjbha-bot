import { env } from '@sjbha/app';

export const strava = {
  get CLIENT_ID () : string {
    return env.getOrThrow ('STRAVA_CLIENT_ID');
  },

  get CLIENT_SECRET () : string {
    return env.getOrThrow ('STRAVA_CLIENT_SECRET');
  }
}