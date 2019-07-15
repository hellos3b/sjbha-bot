import mustache from 'mustache'
import requireText from 'require-text'
import moment from 'moment'
import 'moment-timezone'

const toLocal = (date) => {
  console.log("Date", date.toString())
  const d = moment.utc(date).tz("America/Los_Angeles")
  console.log("to local", d)
  return d.toDate()
}

const parseData = (data) => data ? Object.assign({}, data.options, {
  date: moment.utc(data.timestamp).tz("America/Los_Angeles").format('YYYY-MM-DD'),
  time: moment.utc(data.timestamp).tz("America/Los_Angeles").format("HH:mm")
}) : null

export default (data) => {
  console.log("DATA", data)
  let template =  requireText('./meetup-helper.html', require)
  const meetup = parseData(data)
  console.log("meetup", meetup)
  return mustache.render(template, {meetup, editing: !!data})
}