import { Router } from 'express'
import ui from './tldr'
import memoryUI from './memory'

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('tldr')
    const m = new bastion.Queries('memories')

    router.get('/', (req, res) => {
        q.getAll()
            .then( tldrs => {
                let view = ui({tldrs})
                res.send(view)
            });
    })

    router.get('/memory/:id', (req, res) => {
        m.Schema
            .findOne({ readableID: req.params.id })
            .populate("tldrs")
            .exec()
            .then( memory => {
                let view = memoryUI(memory)
                res.send(view)
            })
        // console.log(req.params)
        // q.getAll()
        //     .then( tldrs => {
        //         let view = ui({tldrs})
        //         res.send(view)
        //     });
    })

    return router
}