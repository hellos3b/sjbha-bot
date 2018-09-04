import OutbreakDB from "./OutbreakDB"

const SEB_ID = "125829654421438464";

export default {

    check: async function({message, user, userID}) {
        const results = message.match(/<@.[0-9]*>/g);
        this.updateNames({user, userID});

        if (!results.length) return;

        const ids = results.map( n => n.replace(/[<@|<@!|>]/g, ""));

        if (!ids.length) return;

        const person = await OutbreakDB.findUser(userID);
        const all = await OutbreakDB.getAll();
        const infected = all.filter( n => n.infection === "infected" );
        const vaccine = all.filter( n => n.infection === "vaccine" );

        // Check the patient zeros
        if ( !(infected.length || vaccine.length) && !person) {
            if (ids.indexOf(SEB_ID) > -1) {
                const infection = !infected.length ? "infected" : "vaccine";
                console.log(`infecting ${user} with ${infection}`);
                await OutbreakDB.saveUser({
                    user,
                    userID,
                    infectedBy: "Patient Zero",
                    infection,
                    message
                });
            }

            return;
        }

        // if not infected
        if (!person) {
            console.log("Person is not infected");
            return;
        }


        // Now infect the other people!
        ids.forEach((id) => {
            console.log("Infecting " + id);
            this.infect({ person, id, user, userID, message });
        });
    },

    infect: async function({person, user, userID, id, message}) {
        const check = await OutbreakDB.findUser(id);
        // already infected
        if (check) {
            console.log(check.user + " is already infected");
            return;
        }

        await OutbreakDB.saveUser({
            user: "",
            userID: id,
            infectedBy: user,
            infectedByID: userID,
            infection: person.infection,
            message
        });
    },

    updateNames: async function({user, userID}) {
        const person = await OutbreakDB.findUser(userID);
        if (person) {
            if (!person.user) {
                person.user = user;
                await OutbreakDB.saveUser(person);
            }
        }
    }

}