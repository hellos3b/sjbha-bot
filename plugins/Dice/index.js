/*
    These are the stupid simple echo commands for the server
*/

const d6 = [1, 2, 3, 4, 5, 6];

const help = `
Roll a dice
\`!roll\` will roll a normal 6 sided dice
\`!roll d_\` will roll a _ sided dice
\`!roll 1 2 3 4\` or \`!roll choice1 choice1\` will roll a dice with the space-separated choices
`

function resolveDice(msg) {
  // default to d6
  if (!msg) return d6;
  const split = msg.trim().split(" ");

  // specific dice options
  if (split.length > 1) return split;

  if (msg.startsWith("d")) {
    const numStr = msg.replace("d", "");
    const len = parseInt(numStr);

    if (isNaN(len)) return null;

    return Array(len)
      .fill(null)
      .map( (n, i) => i+1)
  }

  return null;
}

export default function (bastion, config = {}) {
  return [
    {
      command: "roll",

      help,

      resolve(context, message) {
        const dice = resolveDice(message);

        if (!dice) {
          return `Couldn't resolve the dice, use !dice help if you have no idea what you're doing`
        }

        const rng = Math.floor(Math.random()*dice.length);

        return `Rolled **${dice[rng]}**`;
      }
    },
  ];
}
