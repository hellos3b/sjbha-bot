import * as Discord from "discord.js";
import Bastion from "./Bastion";

export default class Request {
  public readonly bastion: Bastion;
  public readonly message: Discord.Message;

  constructor(bastion: Bastion, message: Discord.Message) {
    this.bastion = bastion;
    this.message = message;
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
  reply = (msg: string|Discord.MessageEmbed) => this.message.channel.send(msg);

  getMember = (discordId?: string) => {
    discordId = discordId || this.message.author.id;
    return this.bastion.getMember(discordId);
  }
}