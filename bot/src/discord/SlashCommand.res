module CommandType = {
  @unboxed type t = CommandType(int)
  let slash = CommandType(1)
}

module OptionType = {
  @unboxed type t = OptionType(int)
  let sub_command = OptionType(1)
  let sub_command_group = OptionType(2)
  let string = OptionType(3)
  let integer = OptionType(4)
  let boolean = OptionType(5)
  let user = OptionType(6)
  let channel = OptionType(7)
  let role = OptionType(8)
  let mentionable = OptionType(9)
  let number = OptionType(10)
  let attachment = OptionType(11)
}

module Permissions = {
  @unboxed type t = Permissions(int)
  let kick = Permissions(2)
}

type option_choice = {
  name: string,
  value: string,
}

type rec command_option = {
  @as("type") type_: OptionType.t,
  name: string,
  description: string,
  required?: bool,
  choices?: array<option_choice>,
  options?: array<command_option>,
}

type config = {
  name: string,
  description: string,
  @as("type") type_: CommandType.t,
  options?: array<command_option>,
  default_member_permissions?: Permissions.t,
}

type t = {
  config: config,
  handle: Interaction.t => promise<unit>,
}

let make = (t: t) => t
