import { Router } from 'express'
import API from '../api'

let q;
let api;

export default (bastion) => {
  const router = Router()
  q = new bastion.Queries('stravaID')
  api = API(bastion)

  router.get('/heatmap/:id', Heatmap)

  return router;
}


const Heatmap = async (req, res) => {
  const id = req.params.id
  const user = await q.findOne({userID: id})
  console.log("USDR", user)

  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  const activities = await api.getAthleteActivities(user.stravaID, user.accessToken, d)

  console.log("activities", activities)
  if (!user) {
    res.send(`Invalid ID`)
  } else {
    res.send(`Hello ${user.user}`)
  }
}