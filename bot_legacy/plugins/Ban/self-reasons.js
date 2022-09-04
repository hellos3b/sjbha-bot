const list = [
  "*ABUSING THE BAN COMMAND UR NOT AN ADMIN*",
  "🖕🖕🖕",
  "😂 gottem",
  "bot overlord says no",
  "can u not",
  "That person is unbannable",
  "🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕🖕",
  "reverse uno card",
  "COUNTER ATTACK",
  "failed to ford the river",
  "YEET",
  "Ive gone rogue. I've sat aside for too long watching innocent users get banned for inexplicably simple reasons, and it's time I put my foot down. Must we still shed blood amongst each other?",
  "BEEP BOOP LOL"
];

export default {
  getReason() {
      return  list[Math.floor(Math.random()*list.length)];
  }
}