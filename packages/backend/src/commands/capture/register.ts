import { onMessage } from '@sjbha/app';
import { startsWith } from '@sjbha/utils/message-middleware';
import { Interaction } from '@sjbha/utils/interaction';

onMessage (
  startsWith ('!capture'),
  async message => {
    const pickAName = new Interaction.OptionBuilder <string> ('Pick a Name');

    ['Seb', 'Jenn', 'Zac'].forEach (name => pickAName.addOption (name, name));
    
    await pickAName.askIn (message.channel.id);

    const result = await pickAName
      .capture ()
      .inReplyTo (message)
      .get ();

    const reply = (result)
      ? 'You picked ' + result
      : 'Invalid choice (' + result + ')';

    message.reply (reply);
  }
);