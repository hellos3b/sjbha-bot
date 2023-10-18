let make = (): Interaction.handler => {
  config: {
    name: "pong",
    description: "Check if the v2 bot is alive",
    type_: Interaction.CommandType.slash,
  },
  handle: Interaction.reply(_, "Ping?"),
}
