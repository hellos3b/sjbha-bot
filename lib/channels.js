import chalk from 'chalk'

export default class {

    constructor(channels) {
        const self = this;
        this.channels = {};
        
        // Set the channels with a getter and setter
        for (var k in channels) {
            this.channels[`_${k}`] = channels[k];
            Object.defineProperty(this, k, { 
                get() { 
                    if (self.restrictID) {
                        return self.restrictID
                    } else {
                        return self.channels[`_${k}`]
                    }
                } 
            });
        }
    }

    restrict(channelID) {
        this.restrictID = channelID;
        console.log(chalk.yellow(`⚠ Restricting all commands to channelID '${channelID}'\n`))
    }

}