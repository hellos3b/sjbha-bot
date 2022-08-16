open Discord

let festivize = msg => `🎄☃️☃️🎄🎁 ${msg} 🎁🎄☃️☃️🎄`
let pluralize = (word, count) =>
  switch count {
  | 1 => word
  | _ => word ++ "S"
  }

let daysUntilChristmas = now => {
  let year = now->Js.Date.getFullYear
  let month = now->Js.Date.getMonth
  let date = now->Js.Date.getDate

  let xmasYear = switch (month, date) {
  | (11., date) if date > 25. => year +. 1.
  | (_, _) => year
  }

  let christmas = Js.Date.makeWithYMDHM(
    ~year=xmasYear,
    ~month=11.,
    ~date=25.,
    ~hours=now->Js.Date.getHours,
    ~minutes=now->Js.Date.getMinutes +. 1.,
    (),
  )

  christmas->DateFns.differenceInDays(now)
}

let daysLeft = message => {
  let now = Js.Date.make()
  let content = switch daysUntilChristmas(now) {
  | 0 => festivize("!!TODAY IS CHRISTMAS!!")
  | days => j`ONLY $days ${pluralize("DAY", days)} UNTIL CHRISTMAS!!`
  }

  let remaining = Message.make(~content, ())
  message.channel
    -> Channel.send (remaining)
    -> ignore
}
