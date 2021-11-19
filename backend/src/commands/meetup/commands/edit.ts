import { Message, MessageEmbed } from 'discord.js';
import YAML from 'yaml';

import { env } from '@sjbha/app';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { validateOptions, ValidationError } from '../common/validateOptions';


// If used alone (!meetup edit) will query user to pick a meetup
// If passed with options (!meetup edit id: __) will try to update the meetup
export async function edit (message: Message) : Promise<void> {
  if (!message.channel.isThread ()) {
    message.reply ('To edit a meetup, use `!meetup edit` inside the meetup\'s thread');
    return;
  }

  const meetup = await db.findOne ({ threadID: message.channelId });

  if (!meetup) {
    message.reply ('Hm, it doesnt look like this thread is for a meetup');
    return;
  }

  if (meetup.organizerID !== message.author.id) {
    message.reply ('You do not have permissions to edit this meetup');
    return;
  }

  message.content.split (' ').length > 2
    ? updateMeetup (message, meetup)
    : getEditLink (message, meetup);
}


// Updates the announcement
async function updateMeetup(message: Message, meetup: db.Meetup) {
  const inputText = message.content.replace ('!meetup edit', '');
  const mention = `<@${message.author.id}>`;

  message.delete ();

  if (meetup.organizerID !== message.author.id) {
    message.channel.send (`${mention} - You do not have permissions to edit this meetup`);
    return;
  }

  const parsed = (() : unknown | undefined => {
    try { return YAML.parse (inputText); }
    catch (e) { return undefined; }
  }) ();

  if (!parsed) {
    message.channel.send (`${mention} - Hm the meetup options are in an invalid format. Make sure you're copy and pasting the whole command correctly.`);
    return;
  }

  const options = validateOptions (parsed);

  if (options instanceof ValidationError) {
    message.channel.send (`${mention} - Something is wrong with the options in your command. Make sure to copy and paste everything from the UI! (${options.error})`);
    return;
  }

  if (meetup.state.type !== 'Live') {
    message.channel.send (`${mention} That meetup cant be edited because it has already ended or has been cancelled`);
    return;
  }

  if (meetup.organizerID !== message.author.id) {
    message.channel.send ('You cant edit the meetup because you are not the organizer');
    return;
  }

  const updated = await db.update ({
    ...meetup,
    organizerID: message.author.id,
    title:       options.title,
    category:    options.category || 'default',
    timestamp:   options.date,
    description: options.description || '',
    links:       options.links ?? [],
    location:    M.location (options)
  });

  // Let the user know it has been done!
  message.channel.send ({ embeds: [
    new MessageEmbed ({
      description: `✨ **${meetup.title}** was updated`
      // todo: display a diff
      // \nChanged ` + changed
      //   .map (key => '`' + key + '`')
      //   .join (', ')
    })
  ] });

  message.channel.isThread () &&
    message.channel.setName (`🗓️  ${M.threadTitle (updated.title, updated.timestamp)}`);
}


// Asks the user to pick a meetup from a list,
// and then generates a link that will preload data into the UI
async function getEditLink(message: Message, meetup: db.Meetup) {
  const editUrl = env.UI_HOSTNAME + '/meetup#' + meetup.id;

  message.channel.send ({ embeds: [
    new MessageEmbed ({
      description: `:pencil2: [Edit '**${meetup.title}**'](${editUrl})`,
      color:       '#d7d99e'
    })
  ] });
}