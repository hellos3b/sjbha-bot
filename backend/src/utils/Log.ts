import chalk from 'chalk';

export const started = (msg: string) : void =>
  console.log (chalk.magenta ('⧖'), msg);

export const event = (msg: string) : void =>
  console.log (chalk.cyan ('>'), msg);