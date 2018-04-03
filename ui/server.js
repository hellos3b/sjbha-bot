import express from 'express'
import bodyParser from 'body-parser';

import logger from 'winston'

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/db', express.static(__dirname + '/../db'));

console.log(__dirname);

app.get('/', (req, res) => {
    logger.info("get /")
    res.send("Up and running!")
})

app.listen(8080, () => console.log('Listening on port 8080!'))