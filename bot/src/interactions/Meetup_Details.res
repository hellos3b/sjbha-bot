type details = {
  title: string,
  description: string,
  date: string,
}

let make = () => {
  title: "",
  description: "",
  date: Date.make()->Date.toISOString,
}

let render = (details): Message.embed => {
  title: details.title,
  description: details.description,
}
