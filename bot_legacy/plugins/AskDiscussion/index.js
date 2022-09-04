import Axios from "axios";
import chalk from "chalk";
import deepmerge from "deepmerge";
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
          "url": "https://www.reddit.com" + thread.permalink,
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
      .filter(n => !n.title.toLowerCase().includes("serious"))
      .filter(n => n.link_flair_css_class !== "breaking-news")
      .filter(n => n.distinguished !== 'moderator')

    // use the top 5
    threads = threads.slice(0, 5)

    threads = threads.map( n => Object.assign({}, {
      title: n.title,
      permalink: n.permalink,
      award_score: n.all_awardings.reduce( (total, r) => (total + r.coin_price), 0)
    })).sort( (a, b) => {
      if (a.award_score > b.award_score) return -1
      if (a.award_score < b.award_score) return 1
      return 0
    })

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
    {
      command: "ask",

      resolve: async function(context, tag) {
        // bot admin
        if (context.channelID !== "430517752546197509") return;
        
        const winner = await chooseThread()
        sendEmbed(winner)
      }
    }
  ];
}
