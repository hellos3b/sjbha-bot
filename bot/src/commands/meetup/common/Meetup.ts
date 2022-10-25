import { DateTime } from "luxon";
import { option } from "ts-option";
import * as db from "../db/meetups";
import { MeetupOptions } from "./MeetupOptions";


/**
 * Used in create & edit, this just formats
 */
export function location (options: MeetupOptions) : db.Meetup["location"] {
   if (options.location) {
      return {
         value:    options.location,
         comments: options.location_comments || "",
         autoLink: option (options.location_linked)
            .getOrElseValue (true) 
      };
   }
   else {
      return undefined;
   }
}


/**
 * Format the title that is used for the meetup thread
 */
export function threadTitle (title: string, timestamp: string) : string {
   const dateShort = DateTime.fromISO (timestamp).toFormat ("MMM dd");
   return `${dateShort} - ${title}`;
}