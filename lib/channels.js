import chalk from 'chalk'

export default class {

    constructor(channels) {
        this.channels = {};
        
        // Set the channels with a getter and setter
        for (var k in channels) {
            this.defineChannel(k, channels[k])
        }
    }

    defineChannel(name, channelID) {
        const self = this
        this.channels[`_${name}`] = channelID
        Object.defineProperty(this, name, { 
            get() { 
                if (self.restrictID) {
                    return self.restrictID
                } else {
                    return self.channels[`_${name}`]
                }
            } 
        });
    }

    restrict(channelID) {
        this.restrictID = channelID;
        console.log(chalk.yellow(`⚠ Restricting all commands to channelID '${channelID}'\n`))
    }

}