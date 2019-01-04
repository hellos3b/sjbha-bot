import { Bastion } from './bastion'

export interface BastionConfig {
  /** Discord bot token */
  token: string;
  /** Channel list for easy reference
   * note: deprecating
   */
  channels: {
    [key: string]: string
  };
  /** ID of the target server */
  serverId: string;
  /** The symbol used to initiate a command (! or @) */
  prefix: string;
  /** Run an express server. Defaults to true */
  ui?: boolean;
}

export interface Context {
  /** Name of the user who sent command */
  user: string;
  /** UserID of the user who sent command */
  userID: string;
  /** Channel ID where command was sent */
  channelID: string;
  /** Message that was sent (Includes command) */
  message: String;
  /** Reference to discord-io bot */
  bot: any;
  /** Some extra stuff that discord-io sends (idk, go peak it) */
  evt: any;
}

export interface PluginResolver {
  (bastion: Bastion, options: any) : Plugin[]
}

/** Transform arguments passed in by Discord.io */
export interface Parser {
  (msg: string, context?: Context) : any;
}

export interface Resolver {
  (context?: Context, args?: any) : string|any;
}

export interface Plugin {
  /** Restrict this route to these channels [channelID] */
  restrict?: string[];
  /** If command is restricted, bot will autoreply this message if used outside of restricted channels */
  restrictMessage?: string;
  /** Ignore these channels [channelID] */
  ignore?: string[];
  /** Throw an error if dependency is not setup in config */
  requires?: string[];
  /** The command to use for this plugin to be called. Will run when !{command} is called */
  command?: string;
  /** An action is a subset of a command, can be called by doing this.route(action) */
  action?: string;
  /** Automatically reply with a help string if `!{command} help` is called */
  help?: string;
  /** Send help string if !command is called with no argument. Default false */
  helpOnEmpty?: boolean;
  /** Takes incoming context, and parses the context. Result of this function gets passed in as the second argument of any Resolver */
  options?: Parser;
  /** Syntax way to run some validates before passing data to resolve(). If a string is returned, the bot will send that as a message and skip resolve() */
  validate?: Resolver;
  /** Main router for the command. If string is returned, will reply with just that */
  resolve: string|Resolver;

  methods?: {
    [key: string]: Function
  };
}

export interface PluginOptions {
  /** Ignore certain channels with this command */
  ignore?   : string | string[];
  /** Restrict this command to specific channels */
  restrict? : string | string[];
}