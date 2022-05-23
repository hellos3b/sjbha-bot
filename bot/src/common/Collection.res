open Belt

let normalizeByInt = (arr: array<'a>, by: 'a => int) =>
  arr->Array.reduce(Map.Int.empty, (m, v) => m->Map.Int.set(by(v), v))

let normalizeByString = (arr: array<'a>, by: 'a => string) =>
  arr->Array.reduce(Map.String.empty, (m, v) => m->Map.String.set(by(v), v))

let uniq = arr => {
  let values = Js.Dict.empty()
  arr->Array.forEach(item => values->Js.Dict.set(item, true))
  values->Js.Dict.keys
}
