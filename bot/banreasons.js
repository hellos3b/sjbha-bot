const list = [
    "Caught sniffing glue",
    "Forgot to turn off the stove",
    "Died (rule 2 no dying)",
    "Replied to a reddit comment without upvoting it first",
    "Kicked the bucket but the bucket kicked back",
    "Has a voat account",
    "Walks too slow",
    "Owns a fedora (rule 3 no fedoras)",
    "Drives a bolt (rule 1 #bolt is gone)",
    "Saying pineapple on a pizza is okay",
    "Producing too much salt",
    "Sharing a buzzfeed article on facebook",
    "Texting while driving (rule 4 no idiots)",
    "Playin No Mans Sky for more than 10 hours",
    "Disrespecting the Queen",
    "VAC banned from a secure server",
    "Rule 69",
    "Rule 420",
    "Non-Christian discussion (rule 5 this is a christian server)",
    "SNAP",
    "Went AFK in boombot",
    "Didn't wave back to PJ (rule 6 be nice)",
    "Posting your nudes in #general",
    "Smuggling Kinder Surprise Eggs across the border in 2005",
    "For being Canadian",
    "Because fuck you that's why",
    "😂😂😂",
    "🖕🖕🔥😤🔥🖕🖕",
    "Disliking a dog photo in #aww (rule 7 no bad doggers)",
    "Wearing socks with sandals",
    "ict3 (rule 8)",
    "Not turning volume up when Toto's Africa came on",
    "Eating unfrosted pop tarts",
    "Joining drunk VC without any alcohol (rule 9 get hydrated)",
    "Using white theme on discord",
    "Inviting people to eat leftover Lasagna but not actually having any",
    "Giving your SO a potato as a gift (rule 10 don't be shitty)",
    "Didn't come through",
    "Ghosting Stacy",
    "Oops wrong person"
];

export default {
    getReason() {
        return  list[Math.floor(Math.random()*list.length)];
    }
}