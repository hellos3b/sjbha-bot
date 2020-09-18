export type Field = {
  name: string;
  value: string;
  inline?: boolean;
};

export const field = (name: string, value: string|number, inline=true): Field => ({name, value: String(value), inline});

/** Sets up the shape for the `fields` prop in an embed */
export const asField = (name: string, inline=true) => (value: string|number) => field(name, value, inline);