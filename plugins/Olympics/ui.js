import { Router } from 'express'
import mustache from 'mustache'
import requireText from 'require-text'
import {createFlag} from './createFlag'

export default (bastion, config) => {
    const router = Router()

    router.get('/', (req, res) => {

      let template =  requireText('./template.html', require)

      // let teamsData = [
      //   {
      //     name: "NBD",
      //     players: "Seb / Jenn",
      //     primary: "#3c78d8",
      //     secondary: "#ffd966",
      //     flag: 1
      //   },
      //   {
      //     name: "Hi",
      //     players: "Cheeze / knockknock",
      //     primary: "#ff00ff",
      //     secondary: "#00ff00",
      //     flag: 8
      //   },
      //   {
      //     name: "Chinoy",
      //     players: "Marian / Arthur",
      //     primary: "#ffff00",
      //     secondary: "#ff0000",
      //     flag: 6
      //   }
      // ]

      // const teams = new Array(8).fill({ empty: true }).map( (n, i) => {
      //   if (teamsData[i]) {
      //     let t = teamsData[i]
      //     t.flagHTML = createFlag(t.flag, t.primary, t.secondary)
      //     return t
      //   } else {
      //     return n
      //   }
      // })

      const q = new bastion.Queries('Olympics')
      q.getAll()
        .then(teamsData => {
          console.log("teamsData", teamsData)
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
    // const q = new bastion.Queries('Outbreak')

    // router.get('/', (req, res) => {
    //     q.getAll()
    //         .then( infections => {
    //             let view = ui({infections})
    //             res.send(view)
    //         });
    // })

    return router
}