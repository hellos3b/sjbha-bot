type t
type expect<'a>

@val external beforeAll: (@uncurry unit => unit) => unit = "beforeAll"
@val external beforeAllAsync: (@uncurry unit => promise<unit>) => unit = "beforeAll"
@val external beforeEach: (@uncurry unit => unit) => unit = "beforeEach"
@val external beforeEachAsync: (@uncurry unit => promise<unit>) => unit = "beforeEach"
@val external describe: (string, @uncurry (unit => unit)) => unit = "describe"
@val external test: (string, @uncurry (unit => unit)) => unit = "test"
@val external testAsync: (string, @uncurry (unit => promise<unit>)) => unit = "test"

@scope("test") external todo: string => unit = "todo"

// -- assertions

@get external not_: expect<'a> => expect<'a> = "not"
@send external toBe: (expect<'a>, 'a) => unit = "toBe"
@send external toBeTruthy: expect<option<'a>> => unit = "toBeTruthy"
@send external toContain: (expect<array<'a>>, 'a) => unit = "toContain"
@send external toContainString: (expect<string>, string) => unit = "toContain"
@send external toEqual: (expect<'a>, 'b) => unit = "toEqual"
@send external toHaveLength: (expect<array<'a>>, int) => unit = "toHaveLength"
@send external toHaveProperty: (expect<{..}>, string) => unit = "toHaveProperty"

external ignore_type: 'a => 'b = "%identity"

// -- mock fn

type fn

@scope("jest") external mock: string => unit = "mock"
@scope("jest") external fn: unit => fn = "fn"

@send external mockClear: fn => unit = "mockClear"
@send external mockReturnValue: (fn, 'b) => unit = "mockReturnValue"
@send external mockReturnValueOnce: (fn, 'b) => unit = "mockReturnValueOnce"

@send external toHaveBeenCalled: expect<fn> => unit = "toHaveBeenCalled"
@send external toHaveBeenCalledTimes: (expect<fn>, int) => unit = "toHaveBeenCalledTimes"

// -- rescript specific asserts

type custom = {pass: bool, message: unit => string}
@scope("expect") external extend: {..} => unit = "extend"

extend({
  "toBeSome": (got: option<'a>) => {
    pass: switch got {
    | Some(_) => true
    | None => false
    },
    message: () => `Expected option to be Some but instead got None`,
  },
  "toBeNone": (got: option<'a>) => {
    pass: switch got {
    | None => true
    | Some(_) => false
    },
    message: () => {
      let val = switch got {
      | Some(x) => x
      | None => ""
      }

      `Expected option to be None but instead got Some(${val})`
    },
  },
  "toBeError": (got: result<'a, 'b>, _) => {
    pass: switch got {
    | Error(_) => true
    | Ok(_) => false
    },
    message: () => {
      let val = switch got {
      | Ok(val) =>
        switch Js.Json.stringifyAny(val) {
        | Some(x) => x
        | None => ""
        }
      | _ => ""
      }

      `Expected result to be Error but instead got Ok(${val})`
    },
  },
})

@send external toBeSome: expect<option<'a>> => unit = "toBeSome"
@send external toBeNone: expect<option<'a>> => unit = "toBeNone"
@send external toBeError: expect<result<'a, 'b>> => unit = "toBeError"

// In order for the custom `expect` functions to be added this module needs to be imported into scope
// So this small hack tricks rescript to import {expect} from this module
external expect_external: 'a => expect<'a> = "expect"
let expect = expect_external
