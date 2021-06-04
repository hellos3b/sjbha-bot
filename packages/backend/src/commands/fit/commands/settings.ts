import { variantList,TypeNames, VariantOf, match } from 'variant';

import { MessageHandler } from '@sjbha/app';
import { Interaction } from '@sjbha/utils/interaction';

const SettingsMenu = variantList (['hr', 'gender']);
type SettingsMenu<T extends TypeNames<typeof SettingsMenu> = undefined>= VariantOf<typeof SettingsMenu, T>;

export const settings : MessageHandler = async message => {
  const actions = new Interaction
    .OptionBuilder <SettingsMenu> ('What would you like to update?')
    .addOption ('Update Max Heartrate', SettingsMenu.hr)
    .addOption ('Update Gender', SettingsMenu.gender);

  await actions.askIn (message.channel.id);

  const action = await actions
    .capture ()
    .inReplyTo (message)
    .get ();

  message.channel.send ('SETTINGS' + action)
}

// const updateGender : MessageHandler = async message => {

// }