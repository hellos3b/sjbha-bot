let queries = [];

function Query(question, { userID, channelID }) {
    this.userID = userID;
    this.channelID = channelID;
}

export default {
    Ask: async function(
        bastion, 
        config, 
        question, 
        { userID, channelID }, 
        validator, 
        retries=1
    ) {
        const query = this
        if (!validator) validator = () => {}
        return new Promise( async (resolve, reject) => {
            let tries = 0

            await bastion.send(channelID, question)

            queries.push({ userID, channelID, resolve,
                exec: async (message) => {
                    if (message === "stop") {
                        resolve(null)
                        query.remove({userID, channelID})
                        await bastion.send(channelID, "Ok")
                        return
                    }
                    const error = validator(message)
                    if (error) {
                        tries++
                        if (tries >= retries) {
                            resolve(null)
                            query.remove({userID, channelID})
                            return
                        }
                        await bastion.send(channelID, error)
                    } else {
                        resolve(message)
                        query.remove({userID, channelID})
                    }
                }
            })

            setTimeout(() => {
                query.remove({ userID, channelID }, true);
            }, config.queryTimeout)
        })
    },

    remove({ userID, channelID }, resolveFail=false) {
        let q = queries.findIndex(q => q.userID === userID && q.channelID === channelID);
        if (q >= 0) {
            let query = queries[q];
            if (resolveFail) {
                query.resolve(null);
            }
            queries.splice(q, 1);
        }
    },

    Test({ message, userID, channelID}) {
        let query = queries.find(q => q.userID === userID && q.channelID === channelID)
        if (query) {
            query.exec(message)
        }
    }
}