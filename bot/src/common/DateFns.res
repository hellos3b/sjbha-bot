// Browse docs here and port them over as we need them
// https://date-fns.org/v2.28.0/docs/Getting-Started

@module external differenceInDays: (Js.Date.t, Js.Date.t) => int = "date-fns/differenceInDays"

@module
external formatDistance: (Js.Date.t, Js.Date.t, @as(json`{addSuffix: true}`) _) => string =
  "date-fns/formatDistance"
@module external setHours: (Js.Date.t, float) => Js.Date.t = "date-fns/setHours"
@module
external setMinutes: (Js.Date.t, float) => Js.Date.t = "date-fns/setMinutes"
