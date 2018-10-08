import deepmerge from 'deepmerge'

const baseConfig = {
    channel: ""
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const log = bastion.Logger("Reddit").log
    
    bastion.app.post('/api/reddithook', function(req, res) {
        log("Reddit Webhook", req.body)
        let body = req.body
        if (body.secret === process.env.REDDIT_HOOK_SECRET) {
            bastion.bot.sendMessage({
                to: config.channel,
                embed: {
                    "author": {
                        "name": body.title,
                        "url": body.url,
                        "icon_url": "https://i.redd.it/rzj02scnpta11.png"
                    },
                    "color": 16729344
                }
            })
        
            res.send("ok")
        } else {
            res.status(401).send("unauthorized")
        }
    })

    return []
}