type component
external cast_component: 'a => component = "%identity"

module Button = {
  type config = {
    @as("type") type_: int,
    style: int,
    label: string,
    custom_id?: string,
    disabled?: bool,
  }

  type style = Primary | Secondary | Success | Danger | Link

  let make = (~label, ~style, ~custom_id=?, ~disabled=?, ()) =>
    cast_component({
      type_: 2,
      label,
      style: switch style {
      | Primary => 1
      | Secondary => 2
      | Success => 3
      | Danger => 4
      | Link => 5
      },
      ?custom_id,
      ?disabled,
    })
}

module TextInput = {
  type config = {
    @as("type") type_: int,
    custom_id: string,
    style: int,
    label: string,
    min_length?: int,
    max_length?: int,
    required?: bool,
    value?: string,
    placeholder?: string,
  }

  type style = Short | Paragraph

  let make = (
    ~label,
    ~custom_id,
    ~style,
    ~min_length=?,
    ~max_length=?,
    ~required=?,
    ~value=?,
    ~placeholder=?,
    (),
  ) =>
    cast_component({
      type_: 4,
      label,
      custom_id,
      style: switch style {
      | Short => 1
      | Paragraph => 2
      },
      ?min_length,
      ?max_length,
      ?required,
      ?value,
      ?placeholder,
    })
}

type row = {
  @as("type") type_: int,
  components: array<component>,
}

let row = components => {
  type_: 1,
  components,
}
