let done = ignore
let identity = a => a

module A = {
   include Belt.Array

   let join = Js.Array2.joinWith
   let find = Js.Array2.find

   let toList = (a: array<'a>): list<'a> =>
      a->Belt.List.fromArray
}

module Date = {
   include Js.Date

   // Includes date-fn utils from
   // https://date-fns.org/v2.28.0/docs/Getting-Started
   @module external differenceInDays: (t, t) => int = "date-fns/differenceInDays"
   @module external formatDistance: (t, t, @as(json`{addSuffix: true}`) _) => string = "date-fns/formatDistance"
   @module external setHours: (t, float) => t = "date-fns/setHours"
   @module external setMinutes: (t, float) => t = "date-fns/setMinutes"

   @module external secondsToMilliseconds: int => int = "date-fns/secondsToMilliseconds"
   @module external minutesToMilliseconds: int => int = "date-fns/minutesToMilliseconds"

   let fromNow = (t: t): string =>
      formatDistance(t, make())
}

module Dict = {
   include Js.Dict
}

module R = {
   include Belt.Result

   let fromOption = (option: option<'a>, err: 'b): result<'a, 'b> =>
      switch option {
         | Some(a) => Ok(a)
         | None => Error(err)
      }

   let mapAsync = (result, fn) =>
      switch result {
         | Error(_) as error => Promise.resolve(error)
         | Ok(value) => fn(value)
            -> Promise.thenResolve(value => Ok(value))
      }

   let flatMapAsync = (result, fn) => {
      switch result {
         | Error(_) as error => error->Promise.resolve
         | Ok(value) => fn(value)
      }
   }

   let ifError = (result, fn): unit =>
      switch result {
         | Error(e) => fn(e)->ignore
         | Ok(_) => ignore()
      }

   let ifOk = (result, fn): unit =>
      switch result {
         | Ok(res) => fn(res)->ignore
         | Error(_) => ignore()
      }
}

// Futre is like 
module Promise = {
   type t<'a> = Promise.t<'a>

   let resolve = Promise.resolve
   let map = Promise.thenResolve
   
   let catch = (t, f) =>
      t->Promise.catch(exn => f(exn)->resolve)

   let flatCatch = (t, f) =>
      t->Promise.catch(exn => f(exn))

   let flatMap = Promise.then
   let ignoreError = t => t->catch(ignore)

   let catchResult = (t, f) =>
      t->map(it => Ok(it))->catch(exn => Error(f(exn)))

   let run = (promise, ~ok, ~catch) =>
      promise
         -> Promise.thenResolve (ok)
         -> Promise.catch (exn => catch(exn)->Promise.resolve)
         -> ignore
}

module L = {
   include Belt.List
}

module O = {
   include Belt.Option

   let alt = (a, b) =>
      switch a {
         | Some(_) as some => some
         | None => b
      }
}

module String = {
   include Js.String2
}