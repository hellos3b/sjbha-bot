/*
* Use this if the bot is asking for something, and waiting a response
*
*/

import logger from 'winston'

let queries = [];

function Query(question, { userID, channelID }) {
    this.userID = userID;
    this.channelID = channelID;
}

// 5 minutes
const QUERY_TIMEOUT = 5 * 60 * 1000;

export default {

    wait({ userID, channelID }) {
        return new Promise( (resolve, reject) => {
            queries.push({
                userID,
                channelID,
                resolve
            });

            setTimeout(() => {
                this.remove({ userID, channelID }, true);
            }, QUERY_TIMEOUT);
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

    check(message, {userID, channelID}) {
        let query = queries.find(q => q.userID === userID && q.channelID === channelID);
        if (query) {
            query.resolve(message);
            this.remove({userID, channelID});
        }
    }

}