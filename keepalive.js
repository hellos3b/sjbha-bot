import http from "http"

setInterval(function() {
    http.get("http://sjbha-bot.herokuapp.com");
}, 300000); // every 5 minutes (300000)