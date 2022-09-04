const players = [
  "Jenny",
  "royroy",
  "Dini",
  "JustAlex",
  "maC",
  "Chamiel",
  "Stacy",
  "imadoctortoo",
  "s3b",
  "Troglodytez",
  "Troglodytez + 1",
  "Platypus",
  "Valia",
  "Valia + 1",
  "PC",
  "Dreadiscool",
  "HarSon",
  "Coin",
  "Roxxxaaayyy",
  "Zac",
  "PhantomAI",
  "Blue",
  "Tim",
  "Tim + 1",
  "PJ",
  "Bennetandthejets",
  "RunningBear",
  "Gio",
  "Gio + 1",
  "Zdawg",
  "Zdawg + 1",
  "Dey Rogerius",
  "Miguel",
  "Miguel + 1",
  "AdviceDog",
  "Orbs",
  "Batteries",
  "Batteries + 1"
];

const teams = [
  "🍆",
  "🙈",
  "🔪",
  "🤔"
]

const intro = `
The (temporary) Team Names are:

1. Team ${teams[0]}
2. Team ${teams[1]}
3. Team ${teams[2]}
4. Team ${teams[3]}
`

var shuffle = function (array) {
	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};

const WAIT_TIME = 2

const wait = (ms) => new Promise( resolve => setTimeout(resolve, ms) )

export default function (bastion, opt = {}) {

  return [

    {
      command: 'draw-teams',

      resolve: async function (context, message) {
        // Only s3b can draw the lotto
        if (context.userID !== '125829654421438464') return;

        const shuff1 = shuffle(players)
        const shuff2 = shuffle(shuff1)
        const shuffed = shuffle(shuff2)

        let lineup = [...shuffed]

        bastion.send(context.channelID, `Welcome to the **Laser Tag Meetup Team Draft**!`)

        this.type(context.channelID)
        await wait(1000 * 5)

        bastion.send(context.channelID, `I will go one by one and assign a player to a team`)

        this.type(context.channelID)
        await wait(1000 * 5)

        bastion.send(context.channelID, intro)

        this.type(context.channelID)

        await wait(1000 * 3)

        bastion.send(context.channelID, `So here we go!`)

        this.type(context.channelID)
        await wait(1000 * 5)

        let roster = [ [], [], [], [] ]
        let t = 0;
        while (lineup.length) {
          const recruit = lineup.splice(0, 1)
          bastion.send(context.channelID, `**${recruit}** to Team ${teams[t]}`)
          roster[t].push(recruit)
          t = (t + 1) % 4

          await wait(1000 * 12)

          this.type(context.channelID)
          await wait(1000 * 3)
        }

        const msg = `
The final team rosters are:

**Team ${teams[0]}**
\`${roster[0].join(", ")}\`

**Team ${teams[1]}**
\`${roster[1].join(", ")}\`

**Team ${teams[2]}**
\`${roster[2].join(", ")}\`

**Team ${teams[3]}**
\`${roster[3].join(", ")}\`

Good Luck!
`
        return msg
      }
    }

  ]
}