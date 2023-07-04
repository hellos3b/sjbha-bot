module ID = {
  let details_modal = "meetup/create/details"
}

type state =
  | Main
  | InputError({error: string, button_id: string})
  | Unrecognized

type form = {
  started: Date.t,
  details: Meetup_Details.details,
  state: state,
}

let makeForm = () => {
  started: Date.make(),
  state: Main,
  details: Meetup_Details.make(),
}

let validDate = (date, time) => {
  let day = Date.fromString(date)
  Ok(Date.make())
}

let updateDetails = (form, ~title, ~description, ~date, ~time) =>
  switch validDate(date, time) {
  | Ok(parsed) => {
      ...form,
      details: {...form.details, title, description, date: Date.toISOString(parsed)},
      state: Main,
    }
  | Error(e) => {
      ...form,
      details: {...form.details, title, description},
      state: InputError({error: "Invalid date", button_id: "meetup/create/edit-details"}),
    }
  }

// updates

let embedFail: Message.embed = {
  description: "Doesn't look like there's a message",
}

let render = (form): Message.config =>
  switch form.state {
  | Main => {
      embeds: [
        {description: "This is a preview of your meetup"},
        Meetup_Details.render(form.details),
      ],
      components: [
        Component.row([
          Component.Button.make(
            ~label="Edit Details",
            ~custom_id="meetup/create/edit-details",
            ~style=Primary,
            (),
          ),
        ]),
      ],
      ephemeral: true,
    }

  | InputError({error, button_id}) => {
      embeds: [
        {
          title: "Input Error",
          description: error,
        },
      ],
      components: [
        Component.row([
          Component.Button.make(~label="Open Modal", ~custom_id=button_id, ~style=Primary, ()),
        ]),
      ],
      ephemeral: true,
    }

  | Unrecognized => {
      embeds: [{description: "Oops"}],
      ephemeral: true,
    }
  }

module DetailsModal = {
  type input = {
    title: string,
    description: string,
    date: string,
  }

  let title_id = "title"
  let desc_id = "description"
  let date_id = "date"

  let make = (~form=?, ()): Modal.config => {
    custom_id: "meetup/create/details",
    title: switch form {
    | Some(_) => "Edit Meetup Details"
    | None => "Create a New Meetup"
    },
    components: [
      Component.row([
        Component.TextInput.make(
          ~label="Meetup Title",
          ~custom_id=title_id,
          ~style=Short,
          ~placeholder="Hapa's brewing",
          ~min_length=6,
          ~value=?form->Option.map(it => it.details.title),
          (),
        ),
      ]),
      Component.row([
        Component.TextInput.make(
          ~label="Description",
          ~custom_id=desc_id,
          ~style=Paragraph,
          ~placeholder="Let others know when ",
          ~value=?form->Option.map(it => it.details.description),
          (),
        ),
      ]),
      Component.row([
        Component.TextInput.make(
          ~label="Date",
          ~custom_id=date_id,
          ~style=Short,
          ~max_length=20,
          ~placeholder="m/d/yy like 6/3/23",
          (),
        ),
      ]),
      // Component.row([
      //   Component.TextInput.make(
      //     ~label="Time",
      //     ~custom_id="time",
      //     ~style=Short,
      //     ~max_length=8,
      //     ~placeholder="7:00 PM",
      //     (),
      //   ),
      // ]),
    ],
  }

  let getInput = (modal: Interaction.ModalSubmit.t) => {
    title: modal.fields->Interaction.ModalSubmit.getTextInputValue(title_id),
    description: modal.fields->Interaction.ModalSubmit.getTextInputValue(desc_id),
    date: modal.fields->Interaction.ModalSubmit.getTextInputValue(date_id),
  }
}

exception StateNotFound
let in_progress: Map.t<string, form> = Map.make()

let getStateExn = id =>
  switch in_progress->Map.get(id) {
  | Some(form) => form
  | None => raise(StateNotFound)
  }

let initializeNewMeetup = async (input: Interaction.ChatInputCommand.t) => {
  input->Interaction.ChatInputCommand.showModal(DetailsModal.make())
}

let onClickEditDetails = async (btn: Interaction.Button.t) =>
  try {
    let form = getStateExn(btn.message.id)
    await btn->Interaction.Button.showModal(DetailsModal.make(~form, ()))
  } catch {
  | StateNotFound =>
    await btn->Interaction.Button.reply({
      content: "I think this is out of date",
      ephemeral: true,
    })
  }

let onSubmitModalDetails = async (modal: Interaction.ModalSubmit.t) =>
  try {
    let message = Nullable.toOption(modal.message)
    let form = switch message {
    | Some(msg) => getStateExn(msg.id)
    | None => makeForm()
    }

    let input = DetailsModal.getInput(modal)
    let next =
      form->updateDetails(
        ~title=input.title,
        ~description=input.description,
        ~date=input.date,
        ~time="",
      )

    let view = render(next)

    if modal->Interaction.ModalSubmit.isFromMessage {
      await modal->Interaction.ModalSubmit.update(view)
    } else {
      await modal->Interaction.ModalSubmit.reply(view)
    }

    let reply = await modal->Interaction.ModalSubmit.fetchReply
    in_progress->Map.set(reply.id, next)
  } catch {
  | StateNotFound =>
    await modal->Interaction.ModalSubmit.reply({
      content: "I think this is out of date",
      ephemeral: true,
    })
  }
