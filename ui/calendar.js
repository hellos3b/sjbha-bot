import mustache from 'mustache'
import requireText from 'require-text'

let template =  requireText('./calendar.html', require)

const parseData = (data) => {
    return data.meetups.map( m => {
        return {
            info: m.info,
            timestamp: m.timestamp,
            type: m.options.type,
            location: m.options.location,
            description: m.options.description,
            info_id: m.info_id,
            username: m.username
        };
    });
};
export default (data) => {
    let meetups = parseData(data)
    console.log('meetups', meetups);
    return mustache.render(template, {meetups: JSON.stringify(meetups)})
}