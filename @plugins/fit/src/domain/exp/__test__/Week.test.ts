import Week from "../Week";
import {DateTime} from "luxon";

/**
  We'll be using the week of 8/23/2020 - 8/29/2020 as a reference

  | Sun     | Mon     | Tues    | Wed     | Thurs   | Fri     | Sat     |
  -----------------------------------------------------------------------
  |16       |17       |18       |19       |20       |21       |22       |
  |         |prev     |         |         |         |         |         |
  |         |week ->  |         |         |         |         |         |
  |         |         |         |         |         |         |         |
  |         |         |         |         |         |         |         |
  -----------------------------------------------------------------------
  |23       |24       |25       |26       |27       |28       |29       |
  |         |this     |         |         |         |         |         |
  |         |week ->  |         |         |         |         |         |
  |         |         |         |         |         |         |         |
  |         |         |         |         |         |         |         |
  -----------------------------------------------------------------------
*/

 const Dates = {
  previous_monday : DateTime.local(2020, 8, 17, 6, 0),
  this_monday     : DateTime.local(2020, 8, 24, 6, 0),
  next_monday     : DateTime.local(2020, 8, 31, 6, 0),
  sunday          : DateTime.local(2020, 8, 23, 6, 0),
  wednesday       : DateTime.local(2020, 8, 25, 6, 0)
}

describe("Week", () => {
  
  it("sets Sunday's start to the previous week", () => {
    const week = Week.createFromDate(Dates.sunday);
    expect(week.start.day).toEqual(Dates.previous_monday.day);
    expect(week.end.day).toEqual(Dates.this_monday.day);
  })

  it("sets Monday to start on the same day", () => {
    const week = Week.createFromDate(Dates.this_monday);
    expect(week.start.day).toEqual(Dates.this_monday.day);
    expect(week.end.day).toEqual(Dates.next_monday.day);
  })

  it("sets a day in the week to start on the same week", () => {
    const week = Week.createFromDate(Dates.wednesday);
    expect(week.start.day).toEqual(Dates.this_monday.day); 
  })

  it("has a unique ID to fit the date", () => {
    const week = Week.createFromDate(Dates.this_monday);
    expect(week.id).toEqual("2020-8-24")
  })
})