type t
type response<'a> = {body: 'a}

@scope("superagent") external post: string => t = "post"
@scope("superagent") external get: string => t = "get"

@send external auth: (t, string, {..}) => t = "auth"
@send external send: (t, {..}) => t = "send"
@send external query: (t, {..}) => t = "query"

@send external run: t => promise<response<JSON.t>> = "then"
