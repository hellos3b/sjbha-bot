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

    if (len > 2000) return "Max dice side is 2000";

    if (isNaN(len)) return "Not a valid number. Usage: `!roll d6`, `!roll d20`, etc";

    return Array(len)
      .fill(null)
      .map( (n, i) => i+1)
  }

  return "No point in rolling a dice with only one side";
}

export default function (bastion, config = {}) {
  return [
    {
      command: "roll",

      help,

      resolve(context, message) {
        const dice = resolveDice(message);

        if (typeof dice === 'string') {
          return `Couldn't roll dice: ${dice}`
        }

        const rng = Math.floor(Math.random()*dice.length);

        return `Rolled **${dice[rng]}**`;
      }
    },
  ];
}
