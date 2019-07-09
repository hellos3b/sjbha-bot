import Axios from 'axios'
import { Router } from 'express'
import chalk from "chalk"
// import StravaLevels from "./StravaLevels"
import "./schema"
import utils from './utils'
import url from '../../utils/url'

// For authenticating
const urls = {
    auth: 'https://www.strava.com/oauth/authorize',
    token: 'https://www.strava.com/oauth/token',
    redirect: process.env.DOMAIN + '/api/strava/accept',
    redirect_dev: 'http://localhost:3000/api/strava/accept'
}

export default bastion => {
    const q = new bastion.Queries('stravaID')

    const Auth = {
        saveOwnerID: async function(userID, code) {
            console.log(chalk.blue("[Strava]"), chalk.gray(`Saving owner for user ${userID}`))
            let client_id = process.env.STRAVA_CLIENT_ID;
            let client_secret = process.env.STRAVA_CLIENT_SECRET;
            // auth and get owner ID
            const res = await Axios.post(urls.token, { client_id, client_secret, code })
        
            const owner_id = res.data.athlete.id
            const access_token = res.data.access_token

            console.log(chalk.blue("[Strava]"), chalk.gray(`Got access token for athlete id ${owner_id}`))

            await q.update({ userID }, { 
                stravaID: owner_id,
                accessToken: access_token 
            })

            console.log(chalk.blue("[Strava]"), chalk.gray(`Saved access token!`))
        },

        notifyCreate: async function() {

        }
    }

    return {

        router() {
            const router = Router()

            // Used for the redirect, needs ?user=&userID from discord
            router.get('/auth', async (req, res) => {
                const user = req.query.user
                const userID = req.query.userID

                const redirect_uri = (process.env.NODE_ENV === 'production') ? urls.redirect : urls.redirect_dev

                q.createOrUpdate({userID}, { user, userID })

                console.log(chalk.blue("[Strava]"), chalk.gray(`Requesting auth from user ${user}`))

                const params = utils.objToParams({
                    client_id: process.env.STRAVA_CLIENT_ID,
                    redirect_uri,
                    response_type: "code",
                    state: userID
                })

                const url = `${urls.auth}?${params}`
                res.redirect(url);
            })


            // Accept the token, save the user into the DB (username -> id match)
            router.get('/accept', function(req, res) {
                console.log(chalk.blue("[Strava]"), chalk.gray(`Hitting /accept`))
                const userID = req.query.state;
                const code = req.query.code;
                
                Auth.saveOwnerID(userID, code);
                res.send("Alrighty boy, you're strava is now hooked to the discord bot! 👍<p>The bot will ping the 5k channel when you record a run");
            })

            return router
        },

        createAuthUrl(userID, user, apiUrl) {
            return url.get(`${apiUrl}/auth`, { userID, user })   
        }

    }
}