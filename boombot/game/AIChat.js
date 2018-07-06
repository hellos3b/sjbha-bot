export default {
	"explicits": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"godamnit",
			"$@#%!",
			"wow",
			"lame",
			"wtf",
			"bullshit"
		]
	},
	"relieved": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"whew",
			"shiiiit thought that was gonna be it lol",
			"not today, bomb",
			"close one!",
			"haha you thought that was gonna be me huh??"
		]
	},
	"firstclick": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"wow that's retarded",
			"i hate this game",
			"that's bullshit, first click?",
			"so unlucky",
			"o k",
			"uninstall"
		]
	},
	"nochoice": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"cmonnn baby lets not boom",
			"no coins, well here goes nothing",
			"you guys are assholes for forcing me to click",
			"fffff i messed up, don't have enough coins",
			"hey bomb, be a team player and don't blow up",
			"bad time to be poor damnit"
		]	
	},
	"nochoicefinal": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"tell my parents i love them",
			"well shit I don't really have a choice :(",
			"let me guess, 'boom'?"
		]	
	},
	"bigpot": {
		get() {
			var rng = Math.floor(Math.random()*this.phrases.length);
			return this.phrases[rng];
		},
		phrases: [
			"yeeeeah boy",
			"Hell yeah",
			"thanks I needed that",
			"haha you guys passing for n o t h i n g"
		]
	}
}