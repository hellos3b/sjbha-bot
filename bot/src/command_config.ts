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