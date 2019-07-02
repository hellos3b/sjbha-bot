import { Router } from 'express'
import ui from './meetup-helper'

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('Meetup')

    router.get('/', (req, res) => {
      if (req.query.id) {
        q.findOne({id: req.query.id})
          .then( data => {
            const view = ui(data)
            res.send(view)
          })
      } else {
        const view = ui()
        res.send(view)
      }
    })

    return router
}