type message

@send external reply: (message, string) => message = "reply"

@get external content: message => string = "content"
