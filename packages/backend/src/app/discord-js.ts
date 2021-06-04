import { Maybe } from 'purify-ts';
import * as Discord from 'discord.js';

export type Message = {
  id:      string;
  author:  User;
  member:  Maybe<Member>;
  content: string;
  channel: TextChannel;
  mentions: {
    roles: Role[];
  };

  // crud
  reply:   (content: string | Discord.MessageEmbed) => Promise<Message>;
  delete: () => Promise<Message>;
  edit: (content: string | Discord.MessageEmbed) => Promise<Message>;
}

export const Message = (message: Discord.Message) : Message => ({
  id:       message.id,
  author:   User (message.author),
  member:   Maybe.fromNullable (message.member).map (Member),
  content:  message.content,
  channel:  TextChannel (<Discord.TextChannel>message.channel),
  mentions: {
    roles: [...message.mentions.roles.values ()].map (Role)
  },

  reply:  content => message.reply (content).then (Message),
  delete: () => message.delete ().then (Message),
  edit:   content => message.edit (content).then (Message)
})

export type User = {
  id:   string;
  username: string;
  avatar: string;
  send: (content: string | Discord.MessageEmbed) => Promise<Message>;
}

export const User = (user: Discord.User) : User => ({
  id:       user.id,
  username: user.username,
  get avatar() {
    return user.displayAvatarURL ();
  },
  
  send: content => user.send (content).then (Message)
});

export type Member = User & {
  nickname: string;
  avatar: string;
  displayColor: number;

  roles: {
    has: (id: string) => boolean;
    add: (id: string) => Promise<Member>;
    remove: (id: string) => Promise<Member>;
  }
}

export const Member = (member: Discord.GuildMember) : Member => ({
  ...User (member.user),
  get nickname() {
    return member.displayName;
  },

  get avatar() {
    return member.user.displayAvatarURL ();
  },

  displayColor: member.displayColor,
  
  roles: {
    has:    id => member.roles.cache.has (id),
    add:    id => member.roles.add (id).then (Member),
    remove: id => member.roles.remove (id).then (Member)
  }
});

export type TextChannel = {
  id: string;
  type: 'dm' | 'text' | 'news';
  send: (content: string | Discord.MessageEmbed) => Promise<Message>;
}

export const TextChannel = (channel: Discord.TextChannel) : TextChannel => ({
  id:   channel.id,
  type: channel.type,
  send: content => channel.send (content).then (Message)
});

export type Role = {
  id: string;
  name: string;
}

export const Role = (role: Discord.Role) : Role => ({
  id:   role.id,
  name: role.name
});