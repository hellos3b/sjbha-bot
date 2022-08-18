open StdLib

type t

type response<'a> = {body: 'a}

@module("superagent")
external get: string => t = "get"

@send external query: (t, {..}) => t = "query"
@send external castToPromise: t => Promise.t<response<'a>> = "%identity"

let run = (t: t): P.t<response<'a>> =>
   t->castToPromise