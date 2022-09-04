const infections = [
  {
    _id: "5e6b181a37d99400eedf3306",
    user: "zdawg",
    userID: "395275539444793344",
    infectedBy: null,
    infectedByID: null,
    message: "@jenny what are your top 5 favorite gifs....",
    timestamp: "2020-03-13T05:20:26.434Z",
    __v: 0
  },
  {
    _id: "5e6b19f137d99400eedf3307",
    user: "imadoctortoo",
    userID: "237325980849405954",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message: "@Big Spicy Antonio Giovinazzi nah hes confirmed human",
    timestamp: "2020-03-13T05:28:17.702Z",
    __v: 0
  },
  {
    _id: "5e6b1a8037d99400eedf3308",
    user: "Cookie",
    userID: "163125643666653184",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message:
      "@Big Spicy Antonio Giovinazzi undefined my friends and i'll be out there for awhile. I'll be there prob up till 9pm if anything",
    timestamp: "2020-03-13T05:30:40.002Z",
    __v: 0
  },
  {
    _id: "5e6b1fcd37d99400eedf3309",
    user: "Mexi_Pad",
    userID: "99027146164404224",
    infectedBy: "imadoctortoo",
    infectedByID: "237325980849405954",
    message:
      "@stacysayshello undefined Thank you and like wise, I had a great time. Looking forward to our next meet up!",
    timestamp: "2020-03-13T05:53:17.406Z",
    __v: 0
  },
  {
    _id: "5e6b208c37d99400eedf330a",
    user: "dihy",
    userID: "74601397701578752",
    infectedBy: "Mexi_Pad",
    infectedByID: "99027146164404224",
    message: "@Mexi_Pad is great",
    timestamp: "2020-03-13T05:56:28.042Z",
    __v: 0
  },
  {
    _id: "5e6b215a37d99400eedf330b",
    user: "BlakeyD",
    userID: "378072633188810753",
    infectedBy: "dihy",
    infectedByID: "74601397701578752",
    message:
      "> @BlakeyD r/chineselanguage discord\n@Dihy  oooh I’ll check it out",
    timestamp: "2020-03-13T05:59:54.217Z",
    __v: 0
  },
  {
    _id: "5e6b329037d99400eedf330f",
    user: "Zachy",
    userID: "257554772943568896",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message: "@Big Spicy Antonio Giovinazzi stop",
    timestamp: "2020-03-13T07:13:20.429Z",
    __v: 0
  },
  {
    _id: "5e6b362d37d99400eedf3310",
    user: "drew",
    userID: "332360486207225856",
    infectedBy: "imadoctortoo",
    infectedByID: "237325980849405954",
    message: "@imadoctortoo stop hating 🤡",
    timestamp: "2020-03-13T07:28:45.971Z",
    __v: 0
  },
  {
    _id: "5e6b364c37d99400eedf3311",
    user: "cheesejaguar",
    userID: "202075126144040960",
    infectedBy: "drew",
    infectedByID: "332360486207225856",
    message: "undefined it’s the search engine that replaced Lycos",
    timestamp: "2020-03-13T07:29:16.553Z",
    __v: 0
  },
  {
    _id: "5e6b37eb37d99400eedf3312",
    user: "VARIAchan",
    userID: "111053541149270016",
    infectedBy: "cheesejaguar",
    infectedByID: "202075126144040960",
    message: "Oh those are some nice bowls @cheesejaguar",
    timestamp: "2020-03-13T07:36:11.166Z",
    __v: 0
  },
  {
    _id: "5e6b384337d99400eedf3313",
    user: "Doot",
    userID: "140728446513840128",
    infectedBy: "drew",
    infectedByID: "332360486207225856",
    message: "damn you believe that shit? undefined",
    timestamp: "2020-03-13T07:37:39.510Z",
    __v: 0
  },
  {
    _id: "5e6b38e237d99400eedf3315",
    user: "jenny",
    userID: "145398757582700544",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "I support you  @Doot",
    timestamp: "2020-03-13T07:40:18.928Z",
    __v: 0
  },
  {
    _id: "5e6b38f337d99400eedf3316",
    user: "advicedog",
    userID: "266728041613361153",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "You nees to finish your kumon under 5 minutes @Doot",
    timestamp: "2020-03-13T07:40:35.998Z",
    __v: 0
  },
  {
    _id: "5e6b3f5637d99400eedf3319",
    user: "Everest",
    userID: "364936376044617729",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message:
      "@Smoot liver, pancreas, small intestine, and large intestine diseases",
    timestamp: "2020-03-13T08:07:50.996Z",
    __v: 0
  },
  {
    _id: "5e6b404637d99400eedf331a",
    user: "JustAlex",
    userID: "195791845131943936",
    infectedBy: "Everest",
    infectedByID: "364936376044617729",
    message: "@Everest civ 6",
    timestamp: "2020-03-13T08:11:50.448Z",
    __v: 0
  },
  {
    _id: "5e6b411337d99400eedf331c",
    user: "s3b",
    userID: "125829654421438464",
    infectedBy: "cheesejaguar",
    infectedByID: "202075126144040960",
    message: "Congrats @cheesejaguar",
    timestamp: "2020-03-13T08:15:15.294Z",
    __v: 0
  },
  {
    _id: "5e6b41f637d99400eedf331d",
    user: "Hasan",
    userID: "92889812566048768",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "!ban @Smoot",
    timestamp: "2020-03-13T08:19:02.481Z",
    __v: 0
  },
  {
    _id: "5e6b42f837d99400eedf331e",
    user: "TripleChinStaceFace",
    userID: "434104467449839674",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message: "woah where's our apology @Big Spicy Antonio Giovinazzi",
    timestamp: "2020-03-13T08:23:20.046Z",
    __v: 0
  },
  {
    _id: "5e6b8ece37d99400eedf3323",
    user: "platypus",
    userID: "605284484341956623",
    infectedBy: "Everest",
    infectedByID: "364936376044617729",
    message: "Good luck on your test @astra",
    timestamp: "2020-03-13T13:46:54.490Z",
    __v: 0
  },
  {
    _id: "5e6b8f6a37d99400eedf3324",
    user: "shinbrian",
    userID: "280864029646258176",
    infectedBy: "Everest",
    infectedByID: "364936376044617729",
    message: "<a:partyparrot:437019717178490900> good luck @astra",
    timestamp: "2020-03-13T13:49:30.462Z",
    __v: 0
  },
  {
    _id: "5e6babe537d99400eedf3327",
    user: "Master Chief",
    userID: "621741478749667329",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "@Smoot oh ok i see",
    timestamp: "2020-03-13T15:51:01.654Z",
    __v: 0
  },
  {
    _id: "5e6babf337d99400eedf3328",
    user: "The Coin Collector",
    userID: "136309638126764032",
    infectedBy: "Master Chief",
    infectedByID: "621741478749667329",
    message: "@Master Chief why do you hate questions",
    timestamp: "2020-03-13T15:51:15.415Z",
    __v: 0
  },
  {
    _id: "5e6babff37d99400eedf3329",
    user: "Polishzx",
    userID: "306992661234188288",
    infectedBy: "Master Chief",
    infectedByID: "621741478749667329",
    message: "undefined Why do you hate gifs?",
    timestamp: "2020-03-13T15:51:27.020Z",
    __v: 0
  },
  {
    _id: "5e6badab37d99400eedf332a",
    user: "Plastic Wrap",
    userID: "148264497935548416",
    infectedBy: "Master Chief",
    infectedByID: "621741478749667329",
    message: "@Master Chief it's not that hard to be an ass, chill out bro",
    timestamp: "2020-03-13T15:58:35.530Z",
    __v: 0
  },
  {
    _id: "5e6bc1d037d99400eedf332d",
    user: "RystariuS",
    userID: "366684794777763852",
    infectedBy: "Zachy",
    infectedByID: "257554772943568896",
    message: "@zacarias",
    timestamp: "2020-03-13T17:24:32.094Z",
    __v: 0
  },
  {
    _id: "5e6bc62b37d99400eedf332e",
    user: "Aye Carumba",
    userID: "518675689075900450",
    infectedBy: "VARIAchan",
    infectedByID: "111053541149270016",
    message: "@UwU_VaLiA_OwO  need more Simon and mag pics/videos pls",
    timestamp: "2020-03-13T17:43:07.343Z",
    __v: 0
  },
  {
    _id: "5e6bc96c37d99400eedf332f",
    user: "Stee V.K.",
    userID: "333634671302672387",
    infectedBy: "Everest",
    infectedByID: "364936376044617729",
    message:
      "@astra good call on the career choice - the only job with increasing demand right now",
    timestamp: "2020-03-13T17:57:00.669Z",
    __v: 0
  },
  {
    _id: "5e6be17037d99400eedf3332",
    user: "pj",
    userID: "419143323664515073",
    infectedBy: "cheesejaguar",
    infectedByID: "202075126144040960",
    message: "@CheeseJaguar some people say nasty things",
    timestamp: "2020-03-13T19:39:28.959Z",
    __v: 0
  },
  {
    _id: "5e6be18337d99400eedf3333",
    user: "dini",
    userID: "330950487010705409",
    infectedBy: "TripleChinStaceFace",
    infectedByID: "434104467449839674",
    message: "@stacysayshello <:meowhearthug:415588670331027478>",
    timestamp: "2020-03-13T19:39:47.000Z",
    __v: 0
  },
  {
    _id: "5e6be96637d99400eedf3335",
    user: "mikaiato",
    userID: "639959706609254402",
    infectedBy: "Aye Carumba",
    infectedByID: "518675689075900450",
    message: "@Aye Carumba YOUR PFP IS THE CUTEST!!",
    timestamp: "2020-03-13T20:13:26.885Z",
    __v: 0
  },
  {
    _id: "5e6be96737d99400eedf3336",
    user: "LotharsEdge",
    userID: "302940624938729478",
    infectedBy: "VARIAchan",
    infectedByID: "111053541149270016",
    message:
      "> The only time I can handle it is when his voice gets meme'd. Like the video where he says China.\n@UwU_VaLiA_OwO \n\nhttps://www.youtube.com/watch?v=u_aLESDql1U&t=0",
    timestamp: "2020-03-13T20:13:27.740Z",
    __v: 0
  },
  {
    _id: "5e6bec5a37d99400eedf3337",
    user: "Batteries",
    userID: "239779902012915714",
    infectedBy: "cheesejaguar",
    infectedByID: "202075126144040960",
    message: "@cheesejaguar wtf",
    timestamp: "2020-03-13T20:26:02.514Z",
    __v: 0
  },
  {
    _id: "5e6bf2c337d99400eedf3338",
    user: "harSon",
    userID: "277287492632444929",
    infectedBy: "Batteries",
    infectedByID: "239779902012915714",
    message: "You can scroll through that @Batteries",
    timestamp: "2020-03-13T20:53:23.882Z",
    __v: 0
  },
  {
    _id: "5e6c008137d99400eedf333a",
    user: "comic",
    userID: "265284737483014145",
    infectedBy: "dihy",
    infectedByID: "74601397701578752",
    message: "lol ok @Dihy",
    timestamp: "2020-03-13T21:52:01.331Z",
    __v: 0
  },
  {
    _id: "5e6c134937d99400eedf3341",
    user: "Blue",
    userID: "95628401045409792",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message:
      "let me know if you get a burrito after @Big Spicy Antonio Giovinazzi <:blobpeek:582998086943768586>",
    timestamp: "2020-03-13T23:12:09.089Z",
    __v: 0
  },
  {
    _id: "5e6c29f837d99400eedf3345",
    user: "giovannib",
    userID: "193169046089367552",
    infectedBy: "advicedog",
    infectedByID: "266728041613361153",
    message: "undefined",
    timestamp: "2020-03-14T00:48:56.583Z",
    __v: 0
  },
  {
    _id: "5e6c64ad37d99400eedf3352",
    user: "Snazzle",
    userID: "133333587192840192",
    infectedBy: "Hasan",
    infectedByID: "92889812566048768",
    message: "hello @hasan",
    timestamp: "2020-03-14T04:59:25.477Z",
    __v: 0
  },
  {
    _id: "5e6c7ffa37d99400eedf3358",
    user: "Pablo Uchiha",
    userID: "285804695237427210",
    infectedBy: "advicedog",
    infectedByID: "266728041613361153",
    message: "Whatever undefined quotes you I can do lower",
    timestamp: "2020-03-14T06:55:54.805Z",
    __v: 0
  },
  {
    _id: "5e6d22fc37d99400eedf3369",
    user: "timoteus",
    userID: "150846447586246657",
    infectedBy: "The Coin Collector",
    infectedByID: "136309638126764032",
    message:
      "@$picy P the Coin Collector hmm, maybe I'll read the Ender's Game series again",
    timestamp: "2020-03-14T18:31:24.958Z",
    __v: 0
  },
  {
    _id: "5e6d30f737d99400eedf336b",
    user: "ID2",
    userID: "427744226436972544",
    infectedBy: "Aye Carumba",
    infectedByID: "518675689075900450",
    message:
      "yeah I think as long as the hairdresser is cool with it (I doubt it would interfere), you're good @Aye Carumba 🍀",
    timestamp: "2020-03-14T19:31:03.369Z",
    __v: 0
  },
  {
    _id: "5e6d357737d99400eedf336c",
    user: "brick",
    userID: "593614585135890482",
    infectedBy: "harSon",
    infectedByID: "277287492632444929",
    message:
      "I like how you can eat 2 weeks worth of food on a weekly basis undefined",
    timestamp: "2020-03-14T19:50:15.375Z",
    __v: 0
  },
  {
    _id: "5e6d45e337d99400eedf336f",
    user: "robertb",
    userID: "511216954191904788",
    infectedBy: "zdawg",
    infectedByID: "395275539444793344",
    message: "@zdawg see if the glue works",
    timestamp: "2020-03-14T21:00:19.348Z",
    __v: 0
  },
  {
    _id: "5e6d639f37d99400eedf3374",
    user: "s0phr0syn3",
    userID: "374708829268606987",
    infectedBy: "jenny",
    infectedByID: "145398757582700544",
    message:
      "> Scroll up like 10 messages\nundefined no I know, I quoted you 😄",
    timestamp: "2020-03-14T23:07:11.637Z",
    __v: 0
  },
  {
    _id: "5e6d6b8037d99400eedf3375",
    user: "orbs",
    userID: "195267822346174464",
    infectedBy: "Blue",
    infectedByID: "95628401045409792",
    message: "undefined did you see that one in imax?",
    timestamp: "2020-03-14T23:40:48.269Z",
    __v: 0
  },
  {
    _id: "5e6d806b37d99400eedf3379",
    user: "knocknock",
    userID: "537010717300359206",
    infectedBy: "giovannib",
    infectedByID: "193169046089367552",
    message: "@Big Spicy Chobani thunder someones asking the real questions",
    timestamp: "2020-03-15T01:10:03.031Z",
    __v: 0
  },
  {
    _id: "5e6d8b2b37d99400eedf337a",
    user: "free the pooh",
    userID: "226894305351041035",
    infectedBy: "Everest",
    infectedByID: "364936376044617729",
    message: "@astra I think juni or akiko might be better",
    timestamp: "2020-03-15T01:55:55.580Z",
    __v: 0
  },
  {
    _id: "5e6dacaa37d99400eedf337f",
    user: "Zach",
    userID: "355181104912662530",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "@Smoot welcome",
    timestamp: "2020-03-15T04:18:50.089Z",
    __v: 0
  },
  {
    _id: "5e6dd21137d99400eedf3382",
    user: "xio_ffb",
    userID: "304092524199411712",
    infectedBy: "jenny",
    infectedByID: "145398757582700544",
    message: "> Guess what\nundefined what? :U",
    timestamp: "2020-03-15T06:58:25.992Z",
    __v: 0
  },
  {
    _id: "5e6de3d737d99400eedf3385",
    user: "pc",
    userID: "600176942741848066",
    infectedBy: "pj",
    infectedByID: "419143323664515073",
    message: "@pj yeeeeeeeee",
    timestamp: "2020-03-15T08:14:15.953Z",
    __v: 0
  },
  {
    _id: "5e6e4fa437d99400eedf338b",
    user: "charlsie",
    userID: "342185453220528129",
    infectedBy: "giovannib",
    infectedByID: "193169046089367552",
    message:
      "@Big Spicy Chobani thunder my cousin just cancelled her wedding at the end of the month. Until they restrict all travel insurance doesn’t kick in which is pretty shitty",
    timestamp: "2020-03-15T15:54:12.485Z",
    __v: 0
  },
  {
    _id: "5e6e70aa37d99400eedf338f",
    user: "TFR",
    userID: "343245967505489920",
    infectedBy: "TripleChinStaceFace",
    infectedByID: "434104467449839674",
    message:
      "@stacysayshello Yes, that's what it is. My egg whites are stiff, but the final mixture is a little runny after mixing with batter",
    timestamp: "2020-03-15T18:15:06.454Z",
    __v: 0
  },
  {
    _id: "5e6e85fb37d99400eedf3391",
    user: "troglodytez",
    userID: "506318329733185538",
    infectedBy: "giovannib",
    infectedByID: "193169046089367552",
    message: "how are you @Big Spicy Chobani thunder ? and undefined ?",
    timestamp: "2020-03-15T19:46:03.865Z",
    __v: 0
  },
  {
    _id: "5e6e878237d99400eedf3392",
    user: "sepnove",
    userID: "192810728908914688",
    infectedBy: "s3b",
    infectedByID: "125829654421438464",
    message:
      "@s3b yeah I remember you saying you liked it. I’ve still never played any but those seem like some real good discounts",
    timestamp: "2020-03-15T19:52:34.104Z",
    __v: 0
  },
  {
    _id: "5e6ee66e37d99400eedf33ef",
    user: "noremac54",
    userID: "398658257742462980",
    infectedBy: "shinbrian",
    infectedByID: "280864029646258176",
    message: "@shinbrian jumping jacks?",
    timestamp: "2020-03-16T02:37:34.902Z",
    __v: 0
  },
  {
    _id: "5e6ee99137d99400eedf33f0",
    user: "pfn0",
    userID: "228587804681175041",
    infectedBy: "s3b",
    infectedByID: "125829654421438464",
    message: "@s3b I went to the mobile at Cuesta park",
    timestamp: "2020-03-16T02:50:57.797Z",
    __v: 0
  },
  {
    _id: "5e6efa5b37d99400eedf33f3",
    user: "macjunkie",
    userID: "467914753101266955",
    infectedBy: "advicedog",
    infectedByID: "266728041613361153",
    message: "undefined yep... :sigh:",
    timestamp: "2020-03-16T04:02:35.498Z",
    __v: 0
  },
  {
    _id: "5e6f081d37d99400eedf33f5",
    user: "royroy",
    userID: "197182266147864578",
    infectedBy: "giovannib",
    infectedByID: "193169046089367552",
    message: "@Big Spicy Chobani thunder i wasn't eligible 😦",
    timestamp: "2020-03-16T05:01:17.131Z",
    __v: 0
  },
  {
    _id: "5e6f088737d99400eedf33f6",
    user: "Terrence",
    userID: "550571948070010880",
    infectedBy: "royroy",
    infectedByID: "197182266147864578",
    message: "yes of course undefined that's what friends are for",
    timestamp: "2020-03-16T05:03:03.004Z",
    __v: 0
  },
  {
    _id: "5e6f27e637d99400eedf33f9",
    user: "csshih",
    userID: "209497723433385985",
    infectedBy: "Aye Carumba",
    infectedByID: "518675689075900450",
    message: "@Aye Carumba 🍀 confirmed, I am camping.",
    timestamp: "2020-03-16T07:16:54.741Z",
    __v: 0
  },
  {
    _id: "5e6fa27737d99400eedf3401",
    user: "Silence.",
    userID: "108417059863425024",
    infectedBy: "pc",
    infectedByID: "600176942741848066",
    message: "@pc paper mask?",
    timestamp: "2020-03-16T15:59:51.961Z",
    __v: 0
  },
  {
    _id: "5e6faadf37d99400eedf3404",
    user: "phantomAI",
    userID: "158747227903229953",
    infectedBy: "VARIAchan",
    infectedByID: "111053541149270016",
    message:
      "@UwU_VaLiA_OwO : I actually have that issue when people ask me the same question  Do they mean my ethnicity, where I was born, or where I've resided the longest.",
    timestamp: "2020-03-16T16:35:43.358Z",
    __v: 0
  },
  {
    _id: "5e6fab7f37d99400eedf3405",
    user: "dreadiscool",
    userID: "316365661582524416",
    infectedBy: "giovannib",
    infectedByID: "193169046089367552",
    message:
      "This isn’t financial advice I’m not a financial advisor @Big Spicy Chobani thunder",
    timestamp: "2020-03-16T16:38:23.495Z",
    __v: 0
  },
  {
    _id: "5e6fbc2c37d99400eedf340b",
    user: "Pal.R",
    userID: "96498843515879424",
    infectedBy: "The Coin Collector",
    infectedByID: "136309638126764032",
    message: "@$picy P the Coin Collector how’s your office doing?",
    timestamp: "2020-03-16T17:49:32.113Z",
    __v: 0
  },
  {
    _id: "5e6fbf7137d99400eedf340d",
    user: "pandateatime",
    userID: "87596203847479296",
    infectedBy: "RystariuS",
    infectedByID: "366684794777763852",
    message: "> i think we heading down\n@babynut why?",
    timestamp: "2020-03-16T18:03:29.050Z",
    __v: 0
  },
  {
    _id: "5e6fc2fa37d99400eedf340e",
    user: "Haz",
    userID: "165030821353226240",
    infectedBy: "pandateatime",
    infectedByID: "87596203847479296",
    message: "undefined @3:30pm edt",
    timestamp: "2020-03-16T18:18:34.169Z",
    __v: 0
  },
  {
    _id: "5e70059f37d99400eedf3419",
    user: "paydro",
    userID: "363554542387855361",
    infectedBy: "charlsie",
    infectedByID: "342185453220528129",
    message: "@charlsie , sweet! She’s my neighbor",
    timestamp: "2020-03-16T23:02:55.827Z",
    __v: 0
  },
  {
    _id: "5e700c4837d99400eedf341a",
    user: "WonTonTony",
    userID: "122544122753056768",
    infectedBy: "royroy",
    infectedByID: "197182266147864578",
    message: "Yeah undefined, dunno why I wasn't anymore",
    timestamp: "2020-03-16T23:31:20.567Z",
    __v: 0
  },
  {
    _id: "5e700dd637d99400eedf341b",
    user: "Johnny Shrimpura",
    userID: "498253615874703370",
    infectedBy: "Haz",
    infectedByID: "165030821353226240",
    message: "@Haz where can I find that article?",
    timestamp: "2020-03-16T23:37:58.258Z",
    __v: 0
  },
  {
    _id: "5e702b1037d99400eedf341f",
    user: "obachuka",
    userID: "415381530295140364",
    infectedBy: "royroy",
    infectedByID: "197182266147864578",
    message: "!mod @royroy  -limit #stoner_corner",
    timestamp: "2020-03-17T01:42:40.993Z",
    __v: 0
  },
  {
    _id: "5e70351837d99400eedf3421",
    user: "gumption",
    userID: "396949109233418241",
    infectedBy: "jenny",
    infectedByID: "145398757582700544",
    message: "Thanks undefined Irish Car Bombs? @$picy P the Coin Collector",
    timestamp: "2020-03-17T02:25:28.726Z",
    __v: 0
  },
  {
    _id: "5e70378237d99400eedf3422",
    user: "cece",
    userID: "682033732999184560",
    infectedBy: "s3b",
    infectedByID: "125829654421438464",
    message: "@s3b",
    timestamp: "2020-03-17T02:35:46.200Z",
    __v: 0
  },
  {
    _id: "5e7044d037d99400eedf3424",
    user: "Bangerz",
    userID: "164375823741091850",
    infectedBy: "cheesejaguar",
    infectedByID: "202075126144040960",
    message: "undefined @CheeseJaguar",
    timestamp: "2020-03-17T03:32:32.011Z",
    __v: 0
  },
  {
    _id: "5e705c7a37d99400eedf3427",
    user: "JV",
    userID: "676940983765565452",
    infectedBy: "csshih",
    infectedByID: "209497723433385985",
    message: "@csshih can you buy me corned beef 😂",
    timestamp: "2020-03-17T05:13:30.850Z",
    __v: 0
  },
  {
    _id: "5e7060d037d99400eedf3428",
    user: "roxxxaaayyy",
    userID: "482740862938382357",
    infectedBy: "advicedog",
    infectedByID: "266728041613361153",
    message:
      "@advicedog did you expect that ending?? I’m still kind of torn about it. I just finished it",
    timestamp: "2020-03-17T05:32:00.806Z",
    __v: 0
  },
  {
    _id: "5e7067ad37d99400eedf342a",
    user: "Stare",
    userID: "145004306628739072",
    infectedBy: "pc",
    infectedByID: "600176942741848066",
    message: "lay ho @pc",
    timestamp: "2020-03-17T06:01:17.285Z",
    __v: 0
  },
  {
    _id: "5e7161b337d99400eedf3446",
    user: "cham_bam",
    userID: "531740464248782868",
    infectedBy: "TripleChinStaceFace",
    infectedByID: "434104467449839674",
    message: "@TripleChinStaceFace this looks amazing!! May have to try",
    timestamp: "2020-03-17T23:48:03.650Z",
    __v: 0
  },
  {
    _id: "5e717d5e37d99400eedf3449",
    user: "bennettandthejets",
    userID: "621564911256076308",
    infectedBy: "royroy",
    infectedByID: "197182266147864578",
    message: "@royroy Fair",
    timestamp: "2020-03-18T01:46:06.649Z",
    __v: 0
  },
  {
    _id: "5e71880637d99400eedf344b",
    user: "fleek",
    userID: "464838110568644609",
    infectedBy: "JustAlex",
    infectedByID: "195791845131943936",
    message: "undefined yes",
    timestamp: "2020-03-18T02:31:34.834Z",
    __v: 0
  },
  {
    _id: "5e72260837d99400eedf3457",
    user: "bleachy",
    userID: "417163863683891201",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "i thought that was me @Smoot",
    timestamp: "2020-03-18T13:45:44.078Z",
    __v: 0
  },
  {
    _id: "5e72644437d99400eedf345d",
    user: "Chamiel",
    userID: "129069337297420289",
    infectedBy: "pj",
    infectedByID: "419143323664515073",
    message:
      "you trying to get a 230 put exercised? undefined and then sell or smth",
    timestamp: "2020-03-18T18:11:16.951Z",
    __v: 0
  },
  {
    _id: "5e726efa37d99400eedf345e",
    user: "Original MG",
    userID: "322461157564612608",
    infectedBy: "troglodytez",
    infectedByID: "506318329733185538",
    message: "@troglodytez the review are really good on your chair",
    timestamp: "2020-03-18T18:56:58.329Z",
    __v: 0
  },
  {
    _id: "5e7291fe37d99400eedf3465",
    user: "PaperbackWriter",
    userID: "283744006108741632",
    infectedBy: "free the pooh",
    infectedByID: "226894305351041035",
    message: "undefined what does it do?",
    timestamp: "2020-03-18T21:26:22.274Z",
    __v: 0
  },
  {
    _id: "5e72c3bf37d99400eedf3482",
    user: "FastManatee",
    userID: "689997433719226376",
    infectedBy: "Doot",
    infectedByID: "140728446513840128",
    message: "@Doot depends on the day but Doritos",
    timestamp: "2020-03-19T00:58:39.259Z",
    __v: 0
  },
  {
    _id: "5e72ecda37d99400eedf3488",
    user: "yyzgirl",
    userID: "126102977650884609",
    infectedBy: "pc",
    infectedByID: "600176942741848066",
    message: "cute new profile pic undefined 😍",
    timestamp: "2020-03-19T03:54:02.965Z",
    __v: 0
  },
  {
    _id: "5e72ed3b37d99400eedf3489",
    user: "jaso",
    userID: "689345126534742047",
    infectedBy: "royroy",
    infectedByID: "197182266147864578",
    message: "undefined i am new here",
    timestamp: "2020-03-19T03:55:39.414Z",
    __v: 0
  },
  {
    _id: "5e72ed8737d99400eedf348a",
    user: "nonagonaway",
    userID: "427896778319331338",
    infectedBy: "jenny",
    infectedByID: "145398757582700544",
    message: "undefined what?",
    timestamp: "2020-03-19T03:56:55.403Z",
    __v: 0
  },
  {
    _id: "5e73031c37d99400eedf348f",
    user: "barfait",
    userID: "176938082514370561",
    infectedBy: "jenny",
    infectedByID: "145398757582700544",
    message:
      "@jenny you can’t be an airhead; you have habanero chips and i don’t, so you’re definitely wiser than i",
    timestamp: "2020-03-19T05:29:00.447Z",
    __v: 0
  },
  {
    _id: "5e7317c837d99400eedf3491",
    user: "QuarantinaAguilera",
    userID: "690066836880228380",
    infectedBy: "Zachy",
    infectedByID: "257554772943568896",
    message: "> wat\n@Zachy I'm v new here 🙏",
    timestamp: "2020-03-19T06:57:12.237Z",
    __v: 0
  },
  {
    _id: "5e737fc437d99400eedf349a",
    user: "sandwiches",
    userID: "517565030259228674",
    infectedBy: "VARIAchan",
    infectedByID: "111053541149270016",
    message: "Omg @UwU_VaLiA_OwO 😮",
    timestamp: "2020-03-19T14:20:52.499Z",
    __v: 0
  }
];