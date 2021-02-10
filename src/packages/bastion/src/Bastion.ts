import * as Discord from "discord.js";
import {TextChannel} from "discord.js";
import {Message} from "./Message";
import logger from "@packages/logger";
import {commander} from "./Command";
import {Subject} from "rxjs";
import { DiscordUser } from "./DiscordUser";

const log = logger("bastion");

interface BastionOptions {
  /** This is used to get a guild instance */
  serverId: string;
  token: string;
  instigator: string;
}

export class Bastion {
  /** Reference to the `discord.js` library client */
  public readonly client = new Discord.Client();

  private readonly serverId: string;
  /** Discord API token */
  private token: string;
  /** The character used to initiate a command */
  public instigator: string;

  private onMessageSubject = new Subject<Message>();
  public command = commander(this.onMessageSubject.asObservable());

  constructor(opt: BastionOptions) {
    this.serverId = opt.serverId;
    this.token = opt.token;
    this.instigator = opt.instigator;
  }

  /** Event handler for when a message comes in */
  private onMessage = async (msg: Discord.Message) => {
    // ignore self
    if (msg.author.bot) return;
    if (!msg.content.startsWith(this.instigator)) return;
    log.debug("Trigger: " + msg.content);

    const message = Message(msg);
    this.onMessageSubject.next(message);
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

  public channel(channelId: string) {
    const channel = this.client.channels.cache.get(channelId) as TextChannel;
    if (!channel) throw new Error(`Can't get channel with id ${channelId}`);
    return channel;
  }

  public member(discordId: string): DiscordUser {
    const user = this.client.users.cache.get(discordId);
    if (!user) throw new Error(`Could not get user with id ${discordId}`);

    const member = this.guild.member(discordId);
    return DiscordUser(user, member);
  }
  
}