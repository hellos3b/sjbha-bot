import Ask from '../plugins/Ask'
import AskDiscussion from '../plugins/AskDiscussion'
import AutoTag from '../plugins/AutoTag'
import Ban from '../plugins/Ban'
import DuckHunt from '../plugins/DuckHunt'
import Dungeon from '../plugins/Dungeon'
import Echos from '../plugins/echos/Echos'
import Events from '../plugins/Events'
import Fools from '../plugins/Fools'
import LaserTag from '../plugins/LaserTag'
import Lotto from '../plugins/Lotto'
import Modelo from '../plugins/Modelo'
import Music from '../plugins/Music'
import Olympics from '../plugins/Olympics'
import Outbreak from '../plugins/Outbreak'
import Dice from '../plugins/Dice'
// plugins
import Ping from '../plugins/echos/Ping'
import Poll from '../plugins/Poll'
import Reddit from '../plugins/Reddit'
import RoyRoyBucks from '../plugins/RoyRoyBucks'
import Stats from '../plugins/Stats'
import StockChart from '../plugins/StockChart'
import Strava from '../plugins/Strava'
import Subscribe from '../plugins/Subscribe'
import TLDR from '../plugins/Tldr'
import Teams from '../plugins/Teams'
import Trading from '../plugins/Trading'
import Upvotes from '../plugins/Upvotes'
import UrbanDictionary from '../plugins/UrbanDictionary'
import Yelling from '../plugins/yelling'
import covid19 from '../plugins/covid19'
import db from '../plugins/db'

const subscriptions = {
//    "jackbox": "706723822228733972",
//    "league": "706723711373279262"
}

export default bastion => ([ 
    db(bastion, {
        mongoUrl: process.env.MONGO_URL
    }),
    Ask,
    Ping,
    Echos,
    Poll,
    TLDR(bastion, {
        listRestrict: ["shitpost", "admin"]
    }),
    Ban,
//  Sports Stuff  
//    Stats(bastion, {
//        restrict: ["430517752546197509"]
//    }),
    Teams(bastion, {
        listRestrict: ["shitpost", "admin"]
    }),
    StockChart(bastion, {
        restrict: ["stocks"]
    }),
    Subscribe(bastion, { subscriptions }),
//    Strava(bastion, {
//        restrict: ["strava", "430517752546197509"]
//    }),
    Events(bastion, {
        command: "meetup",
        announcementChannel: bastion.channels.announcement,
        compactChannel: bastion.channels.compact,

        // dev
        // compact: {"todayId":"598646940770631800","thisWeekId":"598646943412912139","nextWeekId":"598646944465813504","twoWeeksId":"598646945317388309","threeWeeksId":"598646946420359170","laterId":"598646962463571975"}
        // prod
        compact: {
	        "todayId":"728059912818786336",
	        "thisWeekId":"728059913259057196",
	        "nextWeekId":"728059913846390827",
	        "twoWeeksId":"728059914588651540",
	        "threeWeeksId":"728059915129847868",
	        "laterId":"728059934645813290"
	    }
    }),
    Outbreak(bastion, {
        restrict: ["shitpost", "430517752546197509"]
    }),
    AutoTag(bastion, {
        restrict: ["416708557984104448"]
    }),
    Upvotes,
    Dungeon,
    Reddit(bastion, {
        channel: "506911331257942027"
    }),
    DuckHunt(bastion, {
        listRestrict: ["shitpost", "430517752546197509"]
    }),
    RoyRoyBucks,
    Lotto(bastion, {
        restrict: ["506911331257942027", "430517752546197509"]
    }),
    Music,
    Olympics,
    UrbanDictionary,
    Trading,
    AskDiscussion,
    Yelling,
    LaserTag,
    Modelo,
    // Fools(bastion, {
    //     listRestrict: ["shitpost", "430517752546197509"]
    // })
    covid19,
    Dice
])