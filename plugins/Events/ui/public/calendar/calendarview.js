// Using https://github.com/rykdesjardins/js-calendar#readme
(function() {
    var elem = document.getElementById("calendar");

    const fetchLNGLAT = (location) => {
        return fetch(`http://www.mapquestapi.com/geocoding/v1/address?key=mzpCfy7Ak6CBJyRrfFA30nF5rcZ8jr3T&location=${encodeURI(location)}`)
            .then(r => r.json())
            .then(r => {
                return r.results[0].locations[0].latLng
            });
    }

    const toParam = (obj) => {
        return `?` + Object.entries(obj).map( ([key, value]) => key + '=' + encodeURI(value) ).join("&");
    }

    const flatISO = (dateStr) => {
        return dateStr.replace(/-/g, "")
            .replace(/:/g, "")
            .replace(".000", "")
    }

    const GCALLink = (meetup) => {
        let d = new Date(meetup.timestamp);
        let post = new Date(meetup.timestamp);
        post.setHours( post.getHours() + 1);

        const baseUrl = `https://www.google.com/calendar/render`;
        const params = {
            action: "TEMPLATE",
            text: meetup.info,
            dates: `${flatISO(d.toISOString())}/${flatISO(post.toISOString())}`,
            details: meetup.description,
            location: meetup.location,
            sprop:"name"
        };

        return baseUrl + toParam(params);
    }

    window.toParam = toParam;

    const colors = {
        "active": "rgb(216, 99, 99)",
        "drinks": "rgb(200, 157, 23)",
        "event": "rgb(97, 180, 181)",
        "default": "rgb(77, 142, 202)"
    };

    const monthsVocab = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const hash = meetups.reduce( (h, meetup) => {
        h[meetup.info_id] = meetup;
        return h;
    }, {});

    window.hash = hash;

    const Matrix = meetups.reduce( (matrix, meetup) => {
        let date = new Date(meetup.timestamp);
        const year = date.getFullYear(),
            month = date.getMonth(),
            day = date.getDate();

        if (!matrix[year]) {
            matrix[year] = {};
        }
        if (!matrix[year][month]) {
            matrix[year][month] = {};
        }
        if (!matrix[year][month][day]) {
            matrix[year][month][day] = [];
        }
        const color = (colors[meetup.type]) ? colors[meetup.type] : colors.default;
        const event = {
            id: meetup.info_id,
            displayname : meetup.info,
            at : date.getTime(),
            color,
            duration : 1000 * 60 * 60
        }

        matrix[year][month][day].push(event);
        return matrix;
    }, {});


    var calendar = new JSCalendar(elem, {
            views: ["week", "month"],
            width: "full"
        }).init()
        .setMatrix(Matrix)
        .render();

    calendar.on("click", (data, event) => {
        let meetup = hash[event.id];
        showMeetup(meetup)
    });

    const modal = document.getElementById("event-modal");
    modal.addEventListener("click", (e) => {
        if (modal === e.target) {
            modal.classList.add("hide");
        }
    });

    // leading 0
    function z(n){return (n<10?'0':'')+n}

    function showMeetup(meetup) {
        const infoLink = `https://discordapp.com/channels/358442034790400000/430878436027006978/${meetup.info_id}`;
        const date = new Date(meetup.timestamp);
        const dateLater = new Date(date.getTime());
        dateLater.setHours( dateLater.getHours() + 1);
        var amOrPm = (date.getHours() < 12) ? "am" : "pm";
        var hour = (date.getHours() < 12) ? date.getHours() : date.getHours() - 12;

        const date_str = `${monthsVocab[date.getMonth()]} ${date.getDate()}, ${hour}:${z(date.getMinutes())} ${amOrPm}`;
        let html = document.createElement("div");
        html.innerHTML += `<h2>${meetup.info.replace(/\n/g, "<br />")}</h2>`
        html.innerHTML += `<div class='muted'>${date_str} - Created by ${meetup.username}</div>`
        html.innerHTML += `<div class='description'>${meetup.description}</div>`

        if (meetup.location) {
            html.innerHTML += "<div class='map-container'><div class='placeholder'></div></div>";
            fetchLNGLAT(meetup.location)
                .then( lnglat => {
                    const mapIMG = `https://open.mapquestapi.com/staticmap/v4/getmap?key=mzpCfy7Ak6CBJyRrfFA30nF5rcZ8jr3T&size=640,256&zoom=12&center=${lnglat.lat},${lnglat.lng}&pois=red_1,${lnglat.lat},${lnglat.lng}`;
                    html.querySelector(".map-container").innerHTML = `<div class='location'>${meetup.location}</div><div><img src='${mapIMG}'></div>`;
                    html.querySelector(".map-container img").addEventListener("click", () => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURI(meetup.location)}`)
                    })
                });
        }

        
        html.innerHTML += `<p><a href='${infoLink}}'>RSVP Link</a> | <a href='${GCALLink(meetup)}' target='_blank'>Add to Calendar</a></p>`

        const dialog = document.querySelector("#event-modal .dialog");
        dialog.innerHTML = "";
        dialog.appendChild(html);
        modal.classList.remove("hide");
    }
})();