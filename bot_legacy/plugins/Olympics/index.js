import ui from './ui'
import './Schema'

export default function(bastion, opt={}) {

  bastion.app.use('/olympics', ui(bastion))

  return []
}