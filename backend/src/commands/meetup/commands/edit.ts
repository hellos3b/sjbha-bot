import { Message, MessageEmbed } from 'discord.js';
import YAML from 'yaml';

import { env, Instance } from '@sjbha/app';
import MultiChoice from '@sjbha/utils/multi-choice';

import * as db from '../db/meetups';
import * as M from '../common/Meetup';
import { validateOptions, ValidationError } from '../common/validateOptions';
import { Announcement } from '../common/Announcement';
import { fetchReactions } from '../features/rsvps';


// If used alone (!meetup edit) will query user to pick a meetup
// If passed with options (!meetup edit id: __) will try to update the meetup
export async function edit (message: Message) : Promise<void> {
  message.content.split (' ').length > 2
    ? updateMeetup (message)
    : getEditLink (message);
}


// Updates the announcement
async function updateMeetup(message: Message) {
  const inputText = message.content.replace ('!meetup edit', '');
  const { id, ...parsed } = YAML.parse (inputText);

  if (!id) {
    message.delete ();
    message.reply ('Invalid meetup options, you didnt provide an ID of a meetup to edit. Make sure to use the edit page and copy the whole text');
    return;
  }

  const options = validateOptions (parsed);

  if (options instanceof ValidationError) {
    message.delete ();
    message.reply (options.error);
    return;
  }

  const meetup = await db.findOne ({ id });

  if (!meetup) {
    message.delete ();
    message.reply ('Not a valid meetup ID, make sure to copy from the editor exactly');
    return;
  }

  if (meetup.state.type !== 'Live') {
    message.delete ();
    message.reply ('That meetup cant be edited because it has already ended or has been cancelled');
    return;
  }

  if (meetup.organizerId !== message.author.id) {
    message.delete ();
    message.reply ('You cant edit the meetup because you are not the organizer');
    return;
  }

  await db.update ({
    ...meetup,
    organizerId: message.author.id,
    title:       options.title,
    // todo: verify date format 
    timestamp:   options.date,
    description: options.description || '',
    links:       options.links ?? [],
    location:    M.location (options)
  });


  // Update the post
  switch (meetup.announcement.type) {
    case 'Inline': {
      const message = await Instance.fetchMessage (meetup.announcement.channelId, meetup.announcement.messageId);
      const reactions = await fetchReactions (message);
      await message.edit (Announcement (meetup, reactions));
      break;
    }
  }

  // Let the user know it has been done!
  await message.delete ();
  message.channel.send (
    new MessageEmbed ({
      description: `✨ **${meetup.title}** was updated`
      // todo: display a diff
      // \nChanged ` + changed
      //   .map (key => '`' + key + '`')
      //   .join (', ')
    })
  );
}


// Asks the user to pick a meetup from a list,
// and then generates a link that will preload data into the UI
async function getEditLink(message: Message) {
  const userMeetups = await db.find ({
    state:       { type: 'Live' },
    organizerId: message.author.id
  });
  
  if (!userMeetups.length) {
    message.reply ('You have no meetups to edit');

    return;
  }

  // Pick a meetup they want to cancel
  const meetupPicker = MultiChoice.create <db.Meetup> (
    'Which meetup would you like to edit?',
    userMeetups.map (meetup => MultiChoice.opt (meetup.title, meetup))
  );

  await message.reply (meetupPicker.toString ());
  const interaction = message.channel.createMessageCollector (m => m.author.id === message.author.id);
  const meetup = await interaction.next.then (meetupPicker.parse);

  if (!meetup)
    return;

  const editUrl = env.UI_HOSTNAME + '/meetup#' + meetup.id;

  message.channel.send (
    new MessageEmbed ({
      description: `:pencil2: [Click here to edit '**${meetup.title}**'](${editUrl})`,
      color:       '#d7d99e'
    })
  );
}