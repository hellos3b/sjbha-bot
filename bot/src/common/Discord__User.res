type t = {
  id: string, 
  username: string
}

@module("discord.js") external mention_: string => string = "userMention"
let mention = t => mention_(t.id)