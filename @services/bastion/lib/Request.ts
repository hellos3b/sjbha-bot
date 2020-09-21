import * as Discord from "discord.js";
import format from "string-format";
import Bastion from "./Bastion";

export default class Request {
  public readonly bastion: Bastion;
  public readonly message: Discord.Message;

  public command: string;
  public route: string;
  public args: string[];

  constructor(bastion: Bastion, message: Discord.Message) {
    this.bastion = bastion;
    this.message = message;

    const [command, ...args] = message.content.split(" ");

    this.command = command;
    this.route = command.substr(
      this.bastion.instigator.length,
      command.length
    );
    this.args = args;
  }

  /** The actual contents of the message */
  get content() {
    return this.message.content;
  }

  /** The channelt he message came from */
  get channel() {
    return this.message.channel;
  }

  /** The person who sent the message */
  get author() {
    return this.message.author;
  }
  
  get member() {
    return this.getMember(this.message.author.id);
  }

  /** Reply directly to the incoming message */
  reply(msg: string): Promise<Discord.Message>;
  reply(options: Discord.MessageOptions): Promise<Discord.Message>;
  reply(template: string, ...formats: string[]): Promise<Discord.Message>;
  reply(msg: string|Discord.MessageOptions, ...str: string[]): Promise<Discord.Message> {
    if (typeof msg === "string" && Array.isArray(str)) {
      msg = format(msg, ...str);
    }

    return this.message.channel.send(msg);
  }

  getMember = (discordId?: string) => {
    discordId = discordId || this.message.author.id;
    return this.bastion.getMember(discordId);
  }
}