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
const RESET_RATE = 1000 * 60
const damperThingy = 0.5

const TWO_HOURS = 1000 * 60 * 60 * 2

const scoreHistory = {}
const MAX_HISTORY = 6

const FIVE_MINUTES = 1000 * 60 * 5

const ADMIN_CHANNEL = "430517752546197509"
// const ADMIN_CHANNEL = "530597070558461972"

export default (bastion) => {
  let analyze = {}
  let lastAnalyze = {}

  const resetCounts = () => {
    lastAnalyze = Object.assign({}, analyze)

    for (var k in lastAnalyze) {
      const arr = scoreHistory[k] || []
      const sc = getScore(k)

      if (arr.length > MAX_HISTORY) {
        arr.splice(0, 1)
      }
      
      const data = Object.assign({
        score: sc
      }, lastAnalyze[k])
      arr.push(data)
      scoreHistory[k] = arr
    }

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
    if (message.startsWith("!s") && channelID === ADMIN_CHANNEL) {
      const [cmd, CID] = message.split(" ")
      if (!CID) return bastion.send(channelID, "Need a channel ID")
      const history = scoreHistory[CID]

      const output = history.map( n => `S: ${n.score} | C: ${n.msgCount} | U: ${n.userIDS.size}`).join('\n')
      bastion.send(channelID, bastion.helpers.code(output))
      return;
    }

    if ( (listenChannels.indexOf(channelID) === -1) ) return;

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

  // Do the actual calculations
  const monitor = () => {
    bastion.send(ADMIN_CHANNEL, `\`Beginning monitoring for duck spawn\``)

    const interval = setInterval(() => {
      const channel = checkChannels()
      if (!channel) return;

      clearInterval(interval)
      const mention = `<#${channel}>`
      bastion.send(ADMIN_CHANNEL, `-> POST DUCK in ${mention}`)
      setTimeout(() => {
        monitor()
      }, TWO_HOURS)
    }, FIVE_MINUTES)
  }
  
  const checkChannels = () => {
    for (var cid in scoreHistory) {
      const high = scoreHistory[cid].find( n => n.score >= 350)
      const med = scoreHistory[cid].filter( n => n.score >= 200)

      if (high) {
        bastion.send(ADMIN_CHANNEL, `**HIGH threshold reached!** Score: ${high.score}, messages: ${high.msgCount}, users: ${high.userIDS.size}`)
        return cid;
      }

      if (med.length >= 2) {
        bastion.send(ADMIN_CHANNEL, `**MED threshold reached!** ${med.length} samples > 200`)
        return cid;
      }
    }
    return null;
  }
  
  bastion.on('ready', () => {
    monitor()
  })
}