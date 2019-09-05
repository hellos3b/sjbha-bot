import deepmerge from "deepmerge";
import chalk from "chalk";
import Axios from "axios";
import moment from "moment"

const baseConfig = {
  channelID: "358442034790400001"
  //dev
  // channelID: "530586255197732876"
};

export default function(bastion, opt = {}) {
  const config = deepmerge(baseConfig, opt);

  const sendEmbed = (thread) => {
    bastion.bot.sendMessage({
      to: config.channelID,
      embed: {
        "color": 0x3598db,
        "footer": {
          "text": "Daily Ask Discord question from r/askreddit"
        },
        "author": {
          "name": thread.title,
          "icon_url": "https://imgur.com/uhf6rG3.png"
        }
      }
    })
  }

  const chooseThread = async () => {
    const {data} = await Axios.get(`https://reddit.com/r/AskReddit.json`)

    let threads = data.data.children
      .map( n => n.data)
      .filter(n => !n.over_18)
      .filter(n => !n.title.toLowerCase().includes("reddit"))

    // use the top 5
    threads = threads.slice(0, 5)

    threads = threads.map( n => Object.assign({}, {
      title: n.title,
      award_score: n.all_awardings.reduce( (total, r) => (total + r.coin_price), 0)
    })).sort( (a, b) => a.award_score > b.award_score ? -1 : 1)

    return threads[0]
  }

  const sendQuestion = async () => {
    const thread = await chooseThread()
    sendEmbed(thread)
  }

  bastion.schedule('0 * * * *', () => {
    const m = moment().tz("America/Los_Angeles")
    if (m.hours() !== 16) return;

    sendQuestion()
  })

  return [
    // {
    //   command: "ask",

    //   resolve: async function(context, tag) {
    //     const winner = await chooseThread()
    //     sendEmbed(winner)
    //   }
    // }
  ];
}
