const listenChannels = [
  "358442034790400001",
  "466328017342431233",
  "358442118928400384",
  "358527683337912320",
  "358916551744946177",
  "366820414820843522",
  "358921562658701322",
  "417871633768775693",
  "375143658128932864",
  "483859948850118678",
  "420997471741935617",
  "361192235146018826",
  "464301806533738496",
  "377347268430528522",
  "416525963464146944",
  "429459189824487463",
  "358921536071139330",
  "363123179696422916",
  "376901773656326144",
  "376901773656326144",
  "450913008323919872",
  "420136050065801227",
  "359573690033242119",
  "506911331257942027",

  // DEBUG
  "530586255197732876"
]

// How often to stop tracking shit (in ms)
const RESET_RATE = 1000
const damperThingy = 0.5

export default (bastion) => {
  let analyze = {}
  let lastAnalyze = {}

  const resetCounts = () => {
    lastAnalyze = Object.assign({}, analyze)

    analyze = listenChannels.reduce( (obj, channelID) => {
      obj[channelID] = {
        msgCount: 0,
        userIDS: new Set()
      }
      return obj
    }, {})
  }

  const getScore = (channelID) => {
    if (!lastAnalyze[channelID]) return 0;
    const msgs = lastAnalyze[channelID].msgCount
    const unique = lastAnalyze[channelID].userIDS.size

    return msgs * (damperThingy*Math.pow(unique, 2))
  }

  bastion.on("message", ({userID, channelID, message}) => {
    // TODO: uncomment for prod
    // if (listenChannels.indexOf(channelID) === -1) return;

    if (message === "!s") {
      bastion.send(channelID, getScore(channelID))
      return;
    }
    const derp = analyze[channelID]
    derp.msgCount++
    derp.userIDS.add(userID)

    // const score = getScore(channelID)
    // console.log("SCORE", score)
    // console.log(message, userID, channelID)
  })

  resetCounts()

  // Do the thing
  setInterval(() => resetCounts(), RESET_RATE)
}