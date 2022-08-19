open Belt
open StdLib
open Discord

module Source = {
  type t = {id: string, location: string}

  let make = (id, location) => {id: id, location: location}

  // constants
  let downtown = "Downtown San Jose"
  let eastSanJose = "East San Jose"
  let southSanJose = "South San Jose"
  let santaClara = "Santa Clara"
  let mountainView = "Mountain View"
  let sanMateo = "San Mateo"

  let locations = [downtown, eastSanJose, southSanJose, santaClara, mountainView, sanMateo]

  let items = [
    make("56013", downtown),
    make("64381", downtown),
    make("20757", eastSanJose),
    make("64881", eastSanJose),
    make("56007", eastSanJose),
    make("15245", southSanJose),
    make("54205", southSanJose),
    make("19313", santaClara),
    make("70615", santaClara),
    make("60819", santaClara),
    make("38607", mountainView),
    make("62249", mountainView),
    make("60819", mountainView),
    make("60115", sanMateo),
    make("59143", sanMateo),
    make("67283", sanMateo),
  ]

  let forLocation = location => items->Array.keep(s => s.location === location)
}

module Aqi = {
  type level =
    | Good
    | Sketchy
    | Bad
    | Terrible

  let level = aqi =>
    switch aqi {
    | v if v < 50. => Good
    | v if v < 100. => Sketchy
    | v if v < 150. => Bad
    | _ => Terrible
    }

  @module("@shootismoke/convert")
  external convert: (string, string, string, float) => float = "convert"
  let fromPm25 = pm25 => convert("pm25", "raw", "usaEpa", pm25)

  let average = (aqis: array<float>) => {
    let sum = aqis->Array.reduce(0., (a, b) => a +. b)
    let count = aqis->Array.length->Float.fromInt
    sum /. count
  }
}

module Sensor = {
  type t = {
    // Each sensor has two readings (channel A | B) and if theres a ParentID then that means we're looking at channel B
    @as("ParentID") parentId: option<string>,
    @as("ID") id: string,
    // Needs to be JSON parsed
    @as("Stats") stats: string,
  }

  type stats = {v1: float}
  type response = {results: array<t>}

  let id = sensor => sensor.parentId->Option.getWithDefault(sensor.id)

  external unsafeCastToStats: 'a => stats = "%identity"
  let decodeStats = sensor =>
    switch Js.Json.parseExn(sensor.stats) {
    | json => json->unsafeCastToStats->Some
    | exception _ => None
    }

  let aqi = sensor => sensor->decodeStats->Option.map(s => Aqi.fromPm25(s.v1))

  // async
  let fetch = (ids: array<string>): Promise.t<Js.Dict.t<float>> => {
    open SuperAgent

    get("https://www.purpleair.com/json")
      -> query ({
        "show": ids->Array.joinWith("|", i => i),
      })
      -> run
      -> Promise.map (res => {
        let byId = Js.Dict.empty()
        res.body.results->Array.forEach(sensor => {
          switch aqi(sensor) {
          | Some(value) => byId->Js.Dict.set(sensor->id, value)
          | None => ignore()
          }
        })
        byId
      })
  }
}

module Embed = {
  let borderColor = aqi =>
    switch Aqi.level(aqi) {
    | Good => 5564977
    | Sketchy => 16644115
    | Bad => 16354326
    | Terrible => 13309719
    }

  let icon = aqi =>
    switch Aqi.level(aqi) {
    | Good => `🟢`
    | Sketchy => `🟡`
    | Bad => `🟠`
    | Terrible => `🔴`
    }

  let aqiForLocation = (location: string, aqiById: Js.Dict.t<float>) =>
    Source.forLocation(location)->Array.keepMap(s => aqiById->Js.Dict.get(s.id))->Aqi.average

  let make = (aqiById: Js.Dict.t<float>) => {
    let totalAqi = aqiById->Js.Dict.values->Aqi.average->Js.Math.round

    open Embed
    Embed.make()
      -> setTitle (j`Air Quality Index • $totalAqi average`)
      -> setColor (borderColor(totalAqi))
      -> setDescription (
        Source.locations
          ->A.map (location => {
            let aqi = location->aqiForLocation(aqiById)->Js.Math.round
            let emoji = icon(aqi)
            j`$emoji **$location** $aqi`
          })
          -> A.join ("\n"))
      -> setFooter ("Based on a 10 minute average from [these Purple Air sensors](https://www.google.com)")
  }
}

let post = msg => {
  Source.items
    -> A.map(s => s.id)
    -> Sensor.fetch
    -> Promise.run (
      ~ok = aqiById => {
        let embed = Message.make (~embeds=[Embed.make(aqiById)], ())
        msg
          -> Message.channel
          -> Channel.send (embed)
          -> done
      },
      ~catch = ignore)
}
