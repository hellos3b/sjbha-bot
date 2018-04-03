import express from 'express'

import logger from 'winston'

const app = express()

app.use('/db', express.static(__dirname + '/../db'));

console.log(__dirname);

app.get('/', (req, res) => {
    logger.info("get /")
    res.send("Up and running!")
})

app.listen(8080, () => console.log('Listening on port 8080!'))