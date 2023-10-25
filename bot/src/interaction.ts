import * as Discord from "discord.js";
import { World } from "./world";

export const commandType = {
   slash: 1
};

export const optionType = {
   sub_command: 1,
   sub_command_group: 2,
   string: 3,
   integer: 4,
   boolean: 5,
   user: 6,
   channel: 7,
   role: 8,
   mentionable: 9,
   number: 10,
   attachment: 11
};

export const permissions = {
   kick: 2
};

export type choice = {
   name: string;
   value: string | number;
};

export type option = {
   type: number;
   name: string;
   description: string;
   required?: boolean;
   choices?: choice[];
   options?: option[];
}

export interface interactionConfig {
   name: string;
   type: number;
   description: string;
   options?: option[];
   default_member_permissions?: number;
}

export interface interaction {
   config: interactionConfig[],
   handle: (interaction: Discord.ChatInputCommandInteraction, world: World) => unknown;
}

export const make = (config: interaction): interaction => config;