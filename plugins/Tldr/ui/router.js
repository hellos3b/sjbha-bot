import { Router } from 'express'
import ui from './tldr'

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('tldr')

    router.get('/', (req, res) => {
        q.getAll()
            .then( tldrs => {
                let view = ui({tldrs})
                res.send(view)
            });
    })

    return router
}