import { hoursToMilliseconds } from "date-fns";
import { ButtonComponentData, ButtonStyle, ComponentType, InteractionReplyOptions } from "discord.js";
import superagent from "superagent";
import * as Interaction from "../interaction";
import { interactionFailed } from "../errors";
import { assertDefined } from "../prelude";

// comes from urban dictionary
interface definition {
   word: string;
   definition: string;
   thumbs_up: number;
   thumbs_down: number;
   example: string;
}

interface urbanDictionaryResponse {
   list: definition[];
}

enum State { Active, Expired }

// How much time do you have to remove a definition
const remove_timeout = hoursToMilliseconds (1);

// how much can we pack into an embed field
const max_field_length = 1024;
const icon = "https://imgur.com/0tEBa59.png";
const embed_color = 16201999;

// if a definition is too long, discord will throw an error
const fitsInEmbed = (definition: definition) =>
   definition.definition.length < max_field_length
   && definition.example.length < max_field_length;

// Show preference to definitions that fit into fields
const findBestMatch = (definitions: definition[]) => definitions.filter (fitsInEmbed)[0] ?? definitions[0];

// UD includes some words like [this] so we'll italicize them
const italicizeReferences = (str: string) => str.replace (/[|]/g, "*");

const trimLen = (str: string, len: number) => str.substring (0, len);

const removeButton: ButtonComponentData = {
   type: ComponentType.Button,
   customId: "undefine",
   label: "Remove",
   style: ButtonStyle.Danger
};

const removedReply: InteractionReplyOptions = {
   embeds: [{
      color: embed_color,
      description: "*This description has been removed*"
   }],
   components: []
};

const invalidOwnerReply: InteractionReplyOptions = {
   content: "Only the person who used the command can remove the post",
   ephemeral: true
};

const makeDefinitionReply = (definition: definition, state: State): InteractionReplyOptions => ({
   embeds: [{
      color: embed_color,
      author: {
         name: definition.word,
         icon_url: icon
      },
      fields: [{
         name: "Definition",
         value: trimLen (italicizeReferences (definition.definition), max_field_length)
      }, {
         name: "Examples",
         value: trimLen (italicizeReferences (definition.example), max_field_length)
      }],
      footer: {
         text: "Definition was pulled from urbandictionary.com"
      }
   }],
   components: (state === State.Active)
      ? [{ type: ComponentType.ActionRow, components: [removeButton] }]
      : []
});

const fetchDefinitions = (word: string) => 
   superagent
      .get ("http://api.urbandictionary.com/v0/define")
      .query ({ term: word })
      .then (res => (<urbanDictionaryResponse>res.body).list);

export const define = Interaction.make ({
   config: [{
      name: "define",
      description: "Look up the definition of a word, according to the all knowing urban dictionary",
      type: Interaction.commandType.slash,
      options: [{
         type: Interaction.optionType.string,
         name: "word",
         description: "The definition to look up",
         required: true
      }]
   }],

   handle: async interaction => {
      const wordOption = interaction.options.getString ("word");
      assertDefined (wordOption, "'word' is a required option");

      const bestDefinition = 
         fetchDefinitions (wordOption)
            .then (findBestMatch);

      try {
         const message = await bestDefinition
            .then (definition => makeDefinitionReply (definition, State.Active))   
            .then (_ => interaction.reply (_));

         const collector = message.createMessageComponentCollector ({
            componentType: ComponentType.Button,
            time: remove_timeout
         });

         collector.on ("collect", i => {
            if (i.user.id === interaction.user.id) {
               interaction.editReply (removedReply);
               collector.handleDispose ();
            }
            else {
               i.reply (invalidOwnerReply);
            }
         });

         collector.on ("end", _ => {
            bestDefinition
               .then (definition => makeDefinitionReply (definition, State.Expired))
               .then (_ => interaction.editReply (_));
         });
      }
      catch (err) {
         interactionFailed (err instanceof Error ? err : new Error ("Unknown"));
      }
   }
});