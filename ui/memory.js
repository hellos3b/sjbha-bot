import mustache from 'mustache'
import requireText from 'require-text'
import moment from 'moment'

let template =  requireText('./memory.html', require)

function parseData(data) {
    data.tldrs = data.tldrs.map( n => {
        let m = moment(n.timestamp).format("MMMM Do, hh:mm a")
        n.date_str = m;
        n.group = moment(n.timestamp).format("MMMM Do");

        return n;
    });

    data.created = moment(data.timestamp).format("MMMM Do, hh:mm a")

    return data;
}

export default (data) => {
    return mustache.render(template, parseData(data))
}