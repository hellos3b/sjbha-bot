let config: SlashCommand.config = {
  name: "meetup",
  type_: SlashCommand.CommandType.slash,
  description: "Create get togethers",
  options: [
    {
      name: "create",
      type_: SlashCommand.OptionType.sub_command,
      description: "Create a new meetup",
    },
  ],
}

let make = (_: MongoDb.db, interaction, next) =>
  switch Interaction.details(interaction) {
  | ChatInput({commandName: "meetup"} as cmd) =>
    switch cmd.options->Interaction.Options.getSubcommand {
    | "create" =>
      let _ = Meetup_Create.initializeNewMeetup(cmd)

    | _ => failwith("unrecognized subcommand")
    }

  | Button({customId: "meetup/create/edit-details"} as btn) =>
    let _ = Meetup_Create.onClickEditDetails(btn)

  | ModalSubmit({customId: "meetup/create/details"} as modal) =>
    let _ = Meetup_Create.onSubmitModalDetails(modal)

  | _ => next()
  }
