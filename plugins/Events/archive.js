/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge'
import "./SchemaArchive"
import moment from 'moment'
import utils from './utils'
import Event from './Event'

export default function(bastion, config) {
    const log = bastion.Logger("Archive").log
    const q = new bastion.Queries('MeetupArchive')
    const Meetups = new bastion.Queries('Meetup')

    bastion.on('schedule-bihourly', archiveMeetups)

    async function archiveMeetups() {
        log("Begin Meetup Archive")
        const meetupsraw = await Meetups.getAll()
        const meetups = meetupsraw.map( e => new Event(e, config))

        log("Meetup count: ", meetups.length)
        for (var i = 0; i < meetups.length; i++) {
            let diff = moment().diff(meetups[i].date_moment(), 'hours')

            log(`Checking meetup`, `[${meetups[i].info()}] diff ${diff} date: ${meetups[i].date_moment()}`, meetups[i])
            if (diff < config.archiveTime) continue

            log(`Archiving meetup ${meetups[i].info}`)
            const event = new Event(meetups[i].toJSON(), config)
            const archive = await event.toArchiveJSON(bastion.bot)

            log("Finishing ", event.info_str())
            await event.finish(bastion.bot)

            log("Removing from event DB ", event.info_str())
            await Meetups.remove({ id: archive.id })

            log("Saving to archive DB ", event.info_str())
            await q.create(archive)

            log("Updating admin DB", event.info_str())
            bastion.send(bastion.channels.admin, "`Archived "+event.info_str()+"`")
        }

        log("End Meetup Archive")
    } 

    return {
        archiveMeetups
    }
}