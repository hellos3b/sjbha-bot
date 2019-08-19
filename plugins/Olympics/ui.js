import { Router } from 'express'
import mustache from 'mustache'
import requireText from 'require-text'
import {createFlag} from './createFlag'

export default (bastion, config) => {
    const router = Router()

    router.get('/', (req, res) => {

      let template =  requireText('./results.html', require)
      res.send(template)
    })
    
    return router
}