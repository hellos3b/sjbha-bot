import bastion from "@services/bastion";
import emojis from "@app/emojis";
import getDays from "./src/days-till-christmas";

bastion.use("christmas", req => {
  const days = getDays();
  const parrots = Array(3).fill(emojis.santaparrot).join("");

  if (days === 0) {
    req.reply(`${parrots} !! TODAY IS CHRISTMAS!! ${parrots}`)
    return;
  }

  const dayTxt = days === 1 ? "DAY" : "DAYS";

  req.reply(`
    ${parrots} ONLY ${days} ${dayTxt} UNTIL CHRISTMAS!! ${parrots}
  `)
});