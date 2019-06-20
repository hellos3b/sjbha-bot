/**
*  Use this as the base template for a new command
* 
*/
import Axios from "axios";

const baseConfig = {
   command: "ban"
}

export default function(bastion, opt={}) {

   return [

       {
           // Command to start it
           command: `define`, 

           // Core of the command
           resolve: async function(context) {
             console.log("context", context.message)
              const [cmd, ...words] = context.message.split(" ")
              const word = words.join(' ')

              if (!word) return;

              const {data} = await Axios.get(`http://api.urbandictionary.com/v0/define?term=${word}`)
              const first = data.list[0]
              console.log("response?", first)
              if (!first) {
                return `No definitions for **${word}**`
              }

              return `**${word.toUpperCase()}:**\n\n`
                + `${first.definition}`
                + `\n\n`
                + bastion.helpers.code(first.example)
           }
       }

   ]
}