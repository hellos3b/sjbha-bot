type t = {
  id: string, 
  name: string,
  @as("type") type_: int
}

type privacy =
   | Public
   | Private

type kind =
   | DM
   | GuildText
   | Thread(privacy)
   | Unknown

@module("discord.js") external mention_: string => string = "channelMention"
let mention = t => mention_(t.id)

let kind = t =>
   switch t.type_ {
   | 0 => GuildText
   | 1 => DM
   | 11 => Thread(Public)
   | 12 => Thread(Private)
   | _ => Unknown 
   }

// validations
let isServerText = (t: t): bool =>
   switch t->kind {
   | GuildText => true
   | Thread(_) => true
   | _ => false
   }