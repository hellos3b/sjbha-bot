# Subscribe

Subscriptions are roles that the user can self-assign and they have the `allow mentions` permission set to true. 

Their main use case is to get pinged for spontaneous activities, such as "@game does anyone want to play?" or "Anyone want to get some @drinks?"

## Usage 

- **!subscribe** - Show a list of available subscriptions
- **!subscribe (role)** - Add the role to yourself
- **!unsubscribe (role)** - Remove the role

## Admin

To add or remove the available subscriptions by using `!subscribe-admin`. By default this command is restricted to the bot-admin channel

You can get the ID of a role in the "roles" tab, right click the role and click "copy id"

- **!subscribe-admin list** - Show a list of the current roles
- **!subscribe-admin add (name) (role id)** - Add a new subscription role
- **!subscribe-admin rm (name)** - Remove a subscription. 

> Note, the role will still exist, you just won't be able to subscribe or unsubscribe from it. You have to remove it from the roles list

- **!subscribe-admin help** - Shows these commands