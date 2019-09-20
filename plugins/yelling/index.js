// Once per minute
const TIMEOUT_TIME = 1000 * 60

export default function(bastion, opt={}) {
  let timeoutActive = false

  const startTimeout = () => {
    timeoutActive = true
    setTimeout(() => {
      timeoutActive = false
    }, TIMEOUT_TIME)

  }
  bastion.on("message", (context) => {
    if (timeoutActive) return;

    if (context.message === context.message.toUpperCase() && context.message.length > 12) {
      bastion.send(context.channelID, "WHY ARE WE YELLING")
      startTimeout()
    }
  })
   return []
}