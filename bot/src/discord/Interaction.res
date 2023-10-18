@unboxed type option_type = Option_Type(int)
@unboxed type command_type = Command_Type(int)

type interaction_option = {
  @as("type") type_: option_type,
  name: string,
  description: string,
  required?: bool,
}

type config = {
  name: string,
  @as("type") type_: command_type,
  description: string,
  options?: array<interaction_option>,
  default_member_permissions?: int,
}

module CommandType = {
  let slash = Command_Type(1)
}

module OptionKind = {
  let sub_command = Option_Type(1)
  let sub_command_group = Option_Type(2)
}

type t

type handler = {
  config: config,
  handle: t => promise<unit>,
}

@send external reply: (t, string) => promise<unit> = "reply"
