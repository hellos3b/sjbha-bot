open StdLib

@scope(("process")) @val external env: Dict.t<string> = "env"
let get = key => env->Dict.get(key)
let getExn = key => env->Dict.get(key)->O.getExn