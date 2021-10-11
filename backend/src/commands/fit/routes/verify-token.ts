import { Route } from '@sjbha/app';

// When registering a strava webhook, they want you to verify the webhook URL
// by echoing back the challenge code they send you
// more information here: https://developers.strava.com/docs/webhooks/
export const verifyToken : Route = async req => ({ 'hub.challenge': req.query['hub.challenge'] });