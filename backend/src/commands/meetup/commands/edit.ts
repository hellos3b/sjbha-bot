import { Message, MessageEmbed } from 'discord.js';
import YAML from 'yaml';

import { env, Instance } from '@sjbha/app';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { validateOptions, ValidationError } from '../common/validateOptions';
import { Announcement } from '../common/Announcement';
import { fetchReactions } from '../features/rsvps';


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

  message.content.split (' ').length > 2
    ? updateMeetup (message, meetup)
    : getEditLink (message, meetup);
}


// Updates the announcement
async function updateMeetup(message: Message, meetup: db.Meetup) {
  const inputText = message.content.replace ('!meetup edit', '');
  const parsed = YAML.parse (inputText);
  const options = validateOptions (parsed);

  if (options instanceof ValidationError) {
    message.delete ();
    message.reply (options.error);
    return;
  }

  if (meetup.state.type !== 'Live') {
    message.delete ();
    message.reply ('That meetup cant be edited because it has already ended or has been cancelled');
    return;
  }

  if (meetup.organizerID !== message.author.id) {
    message.delete ();
    message.reply ('You cant edit the meetup because you are not the organizer');
    return;
  }

  const updated = await db.update ({
    ...meetup,
    organizerID: message.author.id,
    title:       options.title,
    // todo: verify date format 
    timestamp:   options.date,
    description: options.description || '',
    links:       options.links ?? [],
    location:    M.location (options)
  });


  // Update the post
  switch (updated.announcement.type) {
    case 'Inline': {
      const post = await Instance.fetchMessage (updated.announcement.channelId, updated.announcement.messageId);

      if (post.channel.isThread () && post.channel.archived) {
        await post.channel.setArchived (false);
      }

      const reactions = await fetchReactions (post);
      await post.edit ({ embeds: [Announcement (updated, reactions)] });
      break;
    }
  }

  // Let the user know it has been done!
  await message.delete ();
  message.channel.send ({ embeds: [
    new MessageEmbed ({
      description: `✨ **${meetup.title}** was updated`
      // todo: display a diff
      // \nChanged ` + changed
      //   .map (key => '`' + key + '`')
      //   .join (', ')
    })
  ] });
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