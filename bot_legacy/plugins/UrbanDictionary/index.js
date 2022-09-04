/**
*  Use this as the base template for a new command
* 
*/
import Axios from "axios";

const baseConfig = {
   command: "ban"
}

let recentDefinitions = {}

const replaceBrackets = (str) => str.replace(/\[|\]/g, "*")

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

              //Test the examples and definitions for overages in message length or existance, if they are too long, grab the next
              var index = 0
              var dataListIndex = data.list[index]
              //log the first one
              console.log("response?", dataListIndex)
              if (!dataListIndex) {
                //If there were no definitions, let the user know and stop all this mess.
                return `No definitions for **${word}**`
              }
              for (index = 0; index < data.list.length; index++) { 
                dataListIndex = data.list[index]
                if (dataListIndex.definition.length < 1024 && dataListIndex.example.length < 1024) {
                  //cycle through the definitions+examples, the first one that isn't too long, bail.
                  break
                }
              }
              if (dataListIndex.definition.length > 1023 || dataListIndex.example.length > 1023) {
                //if we get here all the definitions are too long, even if that's only 1. So let's use the first
                dataListIndex = data.list[0]
              }
              const bestDef = dataListIndex

              //test for existing values, if none, replace to avoid error
              if(bestDef.definition == ''){
                bestDef.definition = 'No definitions'
              }
              if(bestDef.example == ''){
                bestDef.example = 'No examples'
              }

              const embed = {
                "color": 16201999,
                "author": {
                  "name": bestDef.word,
                  "icon_url": "https://imgur.com/0tEBa59.png"
                },
                "fields": [
                  {
                    "name": "Definition",
                    "value": replaceBrackets(bestDef.definition.substring(0,1023)) //no field can be over 1024
                  },
                  {
                    "name": "Examples",
                    "value": replaceBrackets(bestDef.example.substring(0,1023)) //no field can be over 1024
                  }
                ]
              }

              const msg = await bastion.bot.sendMessage({
                to: context.channelID,
                embed
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