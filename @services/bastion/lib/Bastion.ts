import * as Discord from "discord.js";
import {TextChannel} from "discord.js";
import Router from "./Router";
import Request from "./Request";
import Debug from "debug";

const debug = Debug("bastion");

export default class Bastion extends Router {
  /** Reference to the `discord.js` library client */
  public readonly client = new Discord.Client();

  private readonly serverId: string;
  /** Discord API token */
  private token: string;
  /** The character used to initiate a command */
  public instigator: string;

  constructor(opt: BastionOptions) {
    super()

    this.serverId = opt.serverId;
    this.token = opt.token;
    this.instigator = opt.instigator;
  }

  /** Event handler for when a message comes in */
  private onMessage = async (msg: Discord.Message) => {
    // ignore self
    if (msg.author.bot) return;

    const [command] = msg.content.split(" ");
    if (!command.startsWith(this.instigator)) return;

    debug(`%o`, msg.content);

    const route = command.substr(
      this.instigator.length,
      command.length
    )

    const req = new Request(this, msg);

    this.handle(route, req);
  }

  /** Connects the bot to the server */
  public start = (onConnect=(client: Discord.Client)=>{}) => {
    this.client.on("ready", () => onConnect(this.client));
    this.client.on('message', this.onMessage);
    this.client.login(this.token)
  }

  // Here lets add some... `fixes` to an ugly API
  public get guild() {
    const guild = this.client.guilds.cache.get(this.serverId);
    if (!guild) throw new Error("Cannot get `guild` on Bastion; ServerID config may be incorrect")
    
    return guild;
  }

  public Router() {
    return new Router()
  }

  public sendTo(channelId: string, message: string|Discord.MessageEmbed) {
    const channel = this.client.channels.cache.get(channelId) as TextChannel;
    if (!channel) throw new Error(`Can't get channel with id ${channelId}`);
    return channel.send(message);
  }
  
  public getMember(discordId: string): DiscordMember {
    const member = this.guild.member(discordId);
    const user = this.client.users.cache.get(discordId);

    if (!member || !user) throw new MissingUser(`Could not get user with id ${discordId}`);

    return {
      member,
      avatar: user.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png"
    }
  }
  
}

export interface DiscordMember {
  member: Discord.GuildMember;
  avatar: string;
}

class MissingUser extends Error {
  type = "Missing User"

  constructor(message: string) {
    super(message);
    this.name = "Missing User";
  }
}

interface BastionOptions {
  /** This is used to get a guild instance */
  serverId: string;
  token: string;
  instigator: string;
}