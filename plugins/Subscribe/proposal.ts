// @ts-nocheck

const tagExists = tag => !config.subscriptions[tag] && `Couldn't find tag with name ${tag}`

@Command("subscribe")
@Parameters(["tag"])
class Subscribe {
  
  validate = [
    tagExists
  ]

  async resolve({tag}) {
    const id = config.subscriptions[tag]
    await this.bastion.addRole(context.userID, id)

    return `${context.user} subscribed to ${tag}`
  }
}