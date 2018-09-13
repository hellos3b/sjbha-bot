import { Router } from 'express'
import ui from './outbreak'

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('Outbreak')

    router.get('/', (req, res) => {
        q.getAll()
            .then( infections => {
                let view = ui({infections})
                res.send(view)
            });
    })

    return router
}