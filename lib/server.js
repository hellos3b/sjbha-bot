import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'

export default {
    create() {
        const app = express()

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use('/static', express.static(path.join(__dirname, '..', '/public')))
        
        app.get('/', (req, res) => {
            res.send("Bastion up and running!")
        })

        return app
    }
}