import Ask from '../plugins/Ask'
import AskDiscussion from '../plugins/AskDiscussion'
import AutoTag from '../plugins/AutoTag'
import Ban from '../plugins/Ban'
import DuckHunt from '../plugins/DuckHunt'
import Dungeon from '../plugins/Dungeon'
import Echos from '../plugins/echos/Echos'
import Fools from '../plugins/Fools'
import LaserTag from '../plugins/LaserTag'
import Lotto from '../plugins/Lotto'
import Minecraft from '../plugins/Minecraft'
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
import Trading from '../plugins/Trading'
import Upvotes from '../plugins/Upvotes'
import UrbanDictionary from '../plugins/UrbanDictionary'
import Yelling from '../plugins/yelling'
import covid19 from '../plugins/covid19'
import db from '../plugins/db'

export default bastion => ([
    db(bastion, {
        mongoUrl: process.env.MONGO_URL
    }),
    Ask,
    Ping,
    Echos,
    Poll,
    Ban,
    Stats(bastion, {
        restrict: ["430517752546197509"]
    }),
    StockChart(bastion, {
        restrict: ["stocks"]
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
    Minecraft(bastion, {
        restrict: ["743731120021045328"]
    }),
    Dice
])