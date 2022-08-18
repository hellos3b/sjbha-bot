let done = ignore
let identity = a => a

module A = {
   include Belt.Array

   let join = Js.Array2.joinWith

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

   let fromNow = (t: t): string =>
      formatDistance(t, make())
}

module R = {
   include Belt.Result
}

// Futre is like 
module P = {
   type t<'a> = Promise.t<'a>

   let resolve = Promise.resolve
   let map = Promise.thenResolve
   let catch = (t: t<'a>, f: exn => 'a): t<'a> =>
      t->Promise.catch(exn => f(exn)->resolve)

   let chain = Promise.then

   let run = (promise: t<'a>, ~ok: 'a => unit, ~catch: exn => unit): unit =>
      promise
         -> Promise.thenResolve (ok)
         -> Promise.catch (exn => catch(exn)->Promise.resolve)
         -> ignore
}

module PR = {
   open Promise
   type t<'ok, 'error> = Promise.t<result<'ok, 'error>>

   let error = (e: 'err): t<'ok, 'err> =>
      resolve (Error(e)) 

   let ok = (a: 'a): t<'a, 'b> => 
      resolve (Ok(a))

   let fromResult = (result: result<'ok, 'error>): t<'ok, 'error> =>
      resolve (result)

   let fromPromise = (promise: Promise.t<'a>, mapErr: exn => 'err): t<'a, 'err> =>
      promise
         -> thenResolve (it => Ok(it))
         -> catch (exn => mapErr(exn)->error)

   let fromPredicate = (pred: bool, ifOk: 'a, ifErr: 'err): t<'a, 'err> =>
      if pred { ok(ifOk) } else { error(ifErr) }

   let fromOption = (option: option<'a>, ifError: 'err): t<'a, 'err> =>
      switch option {
         | Some(value) => ok(value)
         | None => error (ifError)
      }

   let map = (t: t<'ok, 'err>, f: 'ok => 'b): t<'b, 'err> =>
      t->thenResolve (it => it->R.map(f))

   let mapResult = (t: t<'ok, 'err>, f: 'ok => result<'ok, 'err>): t<'ok, 'err> =>
      t->thenResolve (it => it->R.flatMap(f))

   let fold = (t: t<'ok, 'err>, f: result<'ok, 'error> => 'b): Promise.t<'b> =>
      t->thenResolve(f)

   let flatMap = (t: t<'ok, 'err>, f: 'ok => t<'b, 'err>): t<'b, 'err> =>
      t->then (it => 
         switch it {
            | Ok(value) => f(value)
            | Error(err) => resolve(Error(err))
         })

   let flatMapP = (t: t<'ok, 'err>, pr: 'ok => P.t<'b>, ifErr: exn => 'err): t<'b, 'err> =>
      t->flatMap(it => pr(it)->fromPromise(ifErr))

   let ifOk = (t: t<'ok, 'err>, f: 'ok => unit): t<'ok, 'err> =>
      t->map (result => {
         f(result)
         result
      })

   let ifError = (t: t<'ok, 'err>, f: 'err => unit): t<'ok, 'err> =>
      t->thenResolve (result => {
         switch result {
            | Error(value) => f(value)->ignore
            | Ok(_) => ignore()
         }
         result
      })

   let validate = (t: t<'ok, 'err>, pred: 'ok => bool, ifErr: 'err): t<'ok, 'err> =>
      t->mapResult (ok =>
         switch pred(ok) {
            | true => Ok(ok)
            | false => Error(ifErr)
         })
}

module L = {
   include Belt.List
}

module O = {
   include Belt.Option
}

module String = {
   include Js.String2
}