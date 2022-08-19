open StdLib
open Discord

let festivize = msg => j`🎄☃️☃️🎄🎁 $msg 🎁🎄☃️☃️🎄`

let pluralize = (word, count) =>
  switch count {
    | 1 => word
    | _ => word ++ "S"
  }

let daysUntilChristmas = now => {
  let year = now->Date.getFullYear
  let month = now->Date.getMonth
  let date = now->Date.getDate

  let xmasYear = switch (month, date) {
    | (11., date) if date > 25. => year +. 1.
    | (_, _) => year
  }

  let christmas = Date.makeWithYMDHM (
    ~year=xmasYear,
    ~month=11.,
    ~date=25.,
    ~hours=now->Date.getHours,
    ~minutes=now->Date.getMinutes +. 1.,
    (),
  )

  christmas->Date.differenceInDays (now)
}

let daysLeft = (message: Message.t) => {
  let now = Date.make()
  let content = switch daysUntilChristmas(now) {
    | 0 => festivize("!!TODAY IS CHRISTMAS!!")
    | days => j`ONLY $days ${pluralize("DAY", days)} UNTIL CHRISTMAS!!`
  }

  Message.make(~content, ())
    -> Message.send (message.channel)
    -> ignore
}
