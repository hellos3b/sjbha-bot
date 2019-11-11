import { Router } from 'express'
import mustache from 'mustache'
import requireText from 'require-text'
import Event from '../Event'

const render = ({meetup, reactions}) => {
  let template = requireText('./public/admin/admin.html', require)

  const rsvps = reactions.yes.map( user => {
    if (meetup.approved.indexOf(user.id) > -1) {
      user.approved = true
    } else {
      user.approved = false
    }
    return user
  })

  console.log('rsvps', rsvps)
  return mustache.render(template, {meetup, rsvps})
}

export default (bastion, config) => {
    const router = Router()
    const q = new bastion.Queries('Meetup')

    router.get('/', async (req, res) => {
      const id = req.query.id
      const pwd = req.query.pwd

      q.findOne({id})
        .then( async (data) => {
          const event = new Event(data, config)
          const reactions = await event.getReactions(bastion.bot)
          const view = await render({meetup: data, reactions})
          res.send(view)
        })
    })

    return router
}