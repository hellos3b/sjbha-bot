type field = {
  name: string,
  value: string,
}
type embed = {
  title?: string,
  description?: string,
  fields?: array<field>,
}
type config = {
  content?: string,
  embeds?: array<embed>,
  components?: array<Component.row>,
  ephemeral?: bool,
}
type t = {id: string}

@send external edit: (t, config) => promise<unit> = "edit"
