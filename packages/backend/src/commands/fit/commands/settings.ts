import { variantList,TypeNames, VariantOf, match } from 'variant';
import * as yup from 'yup';

import { Message, MessageHandler } from '@sjbha/app';
import { Interaction } from '@sjbha/utils/interaction';
import { MessageBuilder, inlineCode } from '@sjbha/utils/string-formatting';

import * as User from '../db/user';
import { EmojiSet } from '../common/activity-emoji';

const SettingsMenu = variantList (['hr', 'emoji']);
type SettingsMenu<T extends TypeNames<typeof SettingsMenu> = undefined>= VariantOf<typeof SettingsMenu, T>;

export const settings : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t authorized with the fitness bot! If you want to join in on the fitness channel, get started with \'!fit auth\'!');

    return;
  }

  const hrText = (user.maxHR)
    ? 'Update Max Heartrate [Current: ' + user.maxHR + ']'
    : 'Set Max Heartrate (Needed for HR based exp)';

  const actions = new Interaction
    .OptionBuilder <SettingsMenu> ('What would you like to do?')
    .addOption (hrText, SettingsMenu.hr)
    .addOption ('Select Emoji Set [Current: ' + user.emojis +']', SettingsMenu.emoji);

  await actions.askIn (message.channel.id);

  const action = await actions
    .capture ()
    .inReplyTo (message)
    .get ();

  if (!action)
    return;

  match (action, {
    hr:    _ => setMaxHeartrate (user, message),
    emoji: _ => setEmoji (user, message)
  });
}

const setMaxHeartrate = async (user: User.Authorized, message: Message) => {
  const maxRecorded = user.maxRecordedHR || 0;

  const prompt = new MessageBuilder ();

  prompt.append ('Your Max Heartrate is used to determine the intensity of your workout, and gives you double exp when you push yourself hard.');
  prompt.space ();

  prompt.append ('👉 **If you don\'t know your Max HR**, you can guesstimate it by using the formula `220 - (your age)`');
  prompt.append ('👉 **If you want to un-set your Max HR**, then simply reply with "remove" and it will be removed')
  prompt.space ();

  prompt.append ('What do you want to set your max heartrate to?');

  await message.channel.send (prompt.toString ());

  const input = await Interaction
    .capture ()
    .inReplyTo (message)
    .setTimeout (1000 * 60)
    .get ();

  if (input === 'remove') {
    await User.update ({
      ...user,
      maxHR: undefined
    });

    message.reply (`Your max heartrate has been updated! ${user.maxHR || 'none'} -> none`);

    return;
  }

  try {
    const hr = await yup
      .number ().typeError ('Sorry, that is not a valid heartrate')
      .required ()
      .integer ('Sorry, that is not a valid heartrate')
      .min (160, `🤔 Are you sure '${input}' is correct? It may be a little too low. If you are sure, DM the bot admin to set it manually`)
      .max (220, `🤔 Are you sure '${input}' is correct? It may be a little too high. If you are sure, DM the bot admin to set it manually`)
      .moreThan (maxRecorded, `Records show that you've recorded a workout that hit at least ${maxRecorded} once, so I believe ${input} might be too low.\nIf this is a mistake, please message the bot admin and we can update it manually`)
      .validate (input, { abortEarly: true });

    await User.update ({
      ...user,
      maxHR: hr
    });

    message.reply (`Your max heartrate has been updated! ${inlineCode (user.maxHR || 'none')} -> ${inlineCode (hr)}`);
  }
  catch (e) {
    message.reply (e.message);
  }
}

const setEmoji = async (user: User.Authorized, message: Message) => {
  const emojis = new Interaction
    .OptionBuilder <EmojiSet> ('Which emoji set do you want to use when an activity posts?')
    .addOption ('People - Default (🏃🚴🧘‍♂️🚶‍♂️🏋️‍♂️🧗‍♀️🤸‍♂️)', 'people-default')
    .addOption ('People - Female (🏃‍♀️🚴‍♀️🧘‍♀️🚶‍♀️🏋️‍♀️🧗‍♂️🤸‍♀️)', 'people-female')
    .addOption ('Objects (👟🚲☮️🥾🥾💪⛰️💦)', 'objects')
    .addOption ('Intensity Based Faces (🙂😶😦😨🥵)', 'intensity')
    .addOption ('Intensity Based Colors (​🟣​🟢​​🟡🟠🔴​​)', 'intensity-circle');

  await emojis.askIn (message.channel.id);

  const input = await emojis
    .capture ()
    .inReplyTo (message)
    .setTimeout (1000 * 60)
    .get ();

  if (!input) {
    return;
  }

  await User.update ({
    ...user,
    emojis: input
  });

  message.reply (`Your Emoji Set has been updated! ${inlineCode (user.emojis)} -> ${inlineCode (input)}`);
}
