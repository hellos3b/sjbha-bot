import mustache from 'mustache'
import requireText from 'require-text'

const parseData = (data) => data ? Object.assign({}, data.options, {
  date: new Date(data.timestamp).toISOString().substr(0, 10),
  time: (() => {
    const d = new Date(data.timestamp)
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  })()
}) : null

export default (data) => {
  let template =  requireText('./meetup-helper.html', require)
  const meetup = parseData(data)
  console.log("meetup", meetup)
  return mustache.render(template, {meetup, editing: !!data})
}