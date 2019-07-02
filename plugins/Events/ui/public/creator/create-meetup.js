/**
       _.-.
 __.-' ,  \
'--'-'._   \
        '.  \
         )-- \ __.--._
        /   .'        '--.
       .               _/-._
       :       ____._/   _-'
        '._          _.'-'
           '-._    _.'
               \_|/
              __|||
 !bang        >__/'

 */

// My one-line jQuery library
const $ = (selector) => document.querySelector(selector)

// I love spacing it out evenly for no reason
const inputs = {
  name          : $('input[name="name"]'),
  date          : $('input[name="date"]'),
  time          : $('input[name="time"]'),
  description   : $('textarea[name="description"]'),
  location      : $('input[name="location"]'),
  url           : $('input[name="url"]'),
  type          : $('select[name="type"]')
}

const resultArea = $('._result')
const resultContainer = $('._result-container')
const copyClipboard = $('button[name="copy"]')

// pre-select a type option
if (editing) {
  const option = $(`option[value='${meetupType}']`)
  
  if (option) option.selected = true
}

const toJSON = () => Object.keys(inputs)
  .reduce( (res, k) => Object.assign(res, { [k]: inputs[k].value }), {})

const formatDate = (date, time) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${time}`
}

const generate = () => {
  const json = toJSON()

  let cmd = editing ? '' : `!meetup ` 
  cmd += `date: ${formatDate(json.date, json.time)} \n| name: ${json.name} \n| description: ${json.description}`

  json.location && (cmd += `\n| location: ${json.location}`)
  json.url && (cmd += `\n| url: ${json.url}`)
  json.image && (cmd += `\n| image: ${json.image}`)
  json.type !== '-' && (cmd += `\n| type: ${json.type}`)

  resultArea.innerHTML = cmd
  resultContainer.style.display = "block"

  window.scrollTo(0,document.body.scrollHeight)
}

const clipboard = () => {
  resultArea.select()
  document.execCommand("copy");

  $('._copied').style.display = "block"
}

$('button[name="generate"]').addEventListener('click', generate)
$('button[name="copy"]').addEventListener('click', clipboard)