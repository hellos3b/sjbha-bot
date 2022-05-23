type t

type response<'a> = {body: 'a}

@module("superagent")
external get: string => t = "get"

@send external query: (t, {..}) => t = "query"
@send external toPromise: t => Promise.t<response<'a>> = "%identity"
