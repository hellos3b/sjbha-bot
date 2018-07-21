import mustache from 'mustache'
import requireText from 'require-text'
import moment from 'moment'

let template =  requireText('./tldr.html', require)

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

function parseData(data) {
    let tldrs = data.tldrs.map( n => {
        let m = moment(n.timestamp).format("hh:mm a")
        n.date_str = m;
        n.group = moment(n.timestamp).format("MMMM Do");

        return n;
    });
    tldrs = groupBy(tldrs, "group");
    let groups = [];
    for (var k in tldrs) {
        groups.push({
            date: k,
            list: tldrs[k]
        });
    }

    data.tldrs = groups;

    return data;
}

export default (data) => {
    return mustache.render(template, parseData(data))
}