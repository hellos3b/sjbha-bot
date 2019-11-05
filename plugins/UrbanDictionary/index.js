/**
*  Use this as the base template for a new command
* 
*/
import Axios from "axios";

const baseConfig = {
   command: "ban"
}

let recentDefinitions = {}

export default function(bastion, opt={}) {

   return [

       {
           // Command to start it
           command: `define`, 

           // Core of the command
           resolve: async function(context) {
              const [cmd, ...words] = context.message.split(" ")
              const word = words.join(' ')

              if (!word) return;

              const {data} = await Axios.get(`http://api.urbandictionary.com/v0/define?term=${word}`)
              const first = data.list[0]
              console.log("response?", first)
              if (!first) {
                return `No definitions for **${word}**`
              }

              const output = `**${word.toUpperCase()}:**\n\n`
                  + `${first.definition}`
                  + `\n\n`
                  + bastion.helpers.code(first.example)

              const msg = await bastion.bot.sendMessage({
                to: context.channelID,
                message: output
              })

              recentDefinitions[context.userID] = [
                msg.id,
                context.channelID
              ]
           }
       },

       {
           // Command to start it
           command: `undefine`, 

           // Core of the command
           resolve: async function(context) {
             const userID = context.userID

             if (!recentDefinitions[userID]) return;

             const [msgId, channelID] = recentDefinitions[userID]

            await bastion.bot.deleteMessage({
                channelID: channelID,
                messageID: msgId
            })

            recentDefinitions[userID] = null

             return '<:shitfuck:555554433048510475>'
           }
       }

   ]
}