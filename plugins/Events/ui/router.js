import { Router } from 'express'
import ui from './calendar'

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('Meetup')

    router.get('/', (req, res) => {
        q.getAll()
            .then( meetups => {
                let view = ui({meetups})
                res.send(view)
            });
    })

    return router
}