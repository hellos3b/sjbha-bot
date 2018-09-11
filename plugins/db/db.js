import mongoose from 'mongoose';
import chalk from 'chalk'


export default {
    connect(config) {
        mongoose.connect(config.mongoUrl)
        const db = mongoose.connection
        db.on('error', console.error.bind(console, 'connection error:'))
        db.once('open', async function() {
            if (process.env.NODE_ENV === "production") {
                console.log(chalk.green("✓"), "Connected to MongoDB")
            } else {
                console.log(chalk.green("✓"), "Connected to MongoDB", chalk.magenta("[DEV SERVER]"))
            }
        })
    }
}