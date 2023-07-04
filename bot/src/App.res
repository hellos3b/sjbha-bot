let configs = [Meetup.config]

let init = (db: MongoDb.db) => {
  let meetup = Meetup.make(db)
  let allCommands = list{meetup}
  let rec exec = (interaction, commands) =>
    switch commands {
    | list{} => ignore()
    | list{cmd, ...tail} =>
      let next = () => exec(interaction, tail)
      cmd(interaction, next)
    }

  let onInteraction = (i: Interaction.t) => exec(i, allCommands)

  onInteraction
}
