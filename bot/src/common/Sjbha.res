module Channels = {
   let admin = Env.getExn("CHANNEL_ADMIN")
   let shitpost = Env.getExn("CHANNEL_SHITPOST")
}