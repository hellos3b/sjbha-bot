import wretch from "@services/node-wretch";
import {debug} from "@plugins/fit/config";
import {
  ActivitiesQuery,
  ActivityResponse, 
  AthleteResponse,
  ActivityStreamResponse
} from "./types";

/**
 * Interaction with the strava Rest API
 */
export default class StravaClient {
  /** Wretch instance ready with auth */
  private api: ReturnType<typeof wretch>;

  constructor(accessToken: string) {
    this.api = wretch()
      .url('https://www.strava.com/api/v3/')
      .headers({Authorization: "Bearer " + accessToken})
      .middlewares([
        next => (url, opt) => {
          debug(`${opt.method} %o`, url);
          return next(url, opt);
        }
      ])
  }

  // /** 
  //  * Get basic Athlete information 
  //  **/

  getProfile() {
    return this.api
      .url(`/athlete`)
      .get()
      .json<AthleteResponse>()
  }

  /**
   * Get a specific activity by ID
   * 
   * @param activityId 
   */

  getActivity(activityId: string) {
    return this.api
      .url(`/activities/${activityId}`)
      .query({
      })
      .get()
      .json<ActivityResponse>()    
  } 

  /**
   * Get a specific activity by ID
   * 
   * @param activityId 
   */

  getActivities(query: ActivitiesQuery={}) {
    return this.api
      .url(`activities`)
      .query(query)
      .get()
      .json<ActivityResponse[]>()    
  } 


  /** 
   * Get heartrate data from an activity
   * 
   * @param activityId
  */
 
  getActivityStreams(activityId: string) {
    const url = `/activities/${activityId}/streams`;
    debug('GET %o', url);
    
    return this.api
      .url(url)
      .query({
        keys: "heartrate,time",
        key_by_type: true
      })
      .get()
      .json<ActivityStreamResponse>();
  }
}