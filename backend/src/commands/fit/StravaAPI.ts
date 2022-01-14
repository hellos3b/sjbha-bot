import Superagent from 'superagent';
import { env } from '@sjbha/app';
import * as Activity from './Activity';

type authResponse = {
  refresh_token: string;
  access_token: string;
  athlete: { 
    id: number; 
    sex: 'M'|'F';
  }  
}

export type stream = {
  type: 'heartrate' | 'time' | string;
  data: number[];
};

export const clientId = () : string =>
  env.getOrThrow ('STRAVA_CLIENT_ID');

const secret = () : string =>
  env.getOrThrow ('STRAVA_CLIENT_SECRET');

// Gets the refresh token that can be used to get access from now on
export const refreshToken = (accessCode: string) : Promise<authResponse> => 
  Superagent
  .post ('https://www.strava.com/oauth/token')
  .send ({
    grant_type:    'authorization_code',
    code:          accessCode,
    client_id:     clientId (),
    client_secret: secret ()
  })
  .then (r => <authResponse>r.body);

// This is the token used for authenticating requests on behalf of a user
export const token = (refreshToken: string) : Promise<string> => 
  Superagent
  .post ('https://www.strava.com/oauth/token')
  .send ({
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
    client_id:     clientId (),
    client_secret: secret ()
  })
  .then (r => (<authResponse>r.body).access_token);

// Details for a specific activity
export const activity = (activityId: number, accessToken: string): Promise<Activity.activity> =>
  Superagent
  .get (`https://www.strava.com/api/v3/activities/${activityId}`)
  .auth (accessToken, { type: 'bearer' })
  .then (r => <Activity.activity>r.body);

// Heartrate data for an activity comes in the form a stream
// https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
export const streams = (activityId: number, accessToken: string): Promise<stream[]> => 
  Superagent
  .get (`https://www.strava.com/api/v3/activities/${activityId}/streams`)
  .query ({ 'keys': 'heartrate,time' })
  .auth (accessToken, { type: 'bearer' })
  .then (r => <stream[]>r.body);
