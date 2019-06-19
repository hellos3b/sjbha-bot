import { Router } from 'express'
import mustache from 'mustache'
import requireText from 'require-text'
import {createFlag} from './createFlag'

export default (bastion, config) => {
    const router = Router()

    router.get('/', (req, res) => {

      let template =  requireText('./template.html', require)

      const q = new bastion.Queries('Olympics')
      q.getAll()
        .then(teamsData => {
          const teams = new Array(8).fill({ empty: true }).map( (n, i) => {
            if (teamsData[i]) {
              let t = teamsData[i]
              t.flagHTML = createFlag(t.flag, t.primary, t.secondary)
              return t
            } else {
              return n
            }
          })

          let view = mustache.render(template, {teams})
          res.send(view)
        })
    })
    
    return router
}