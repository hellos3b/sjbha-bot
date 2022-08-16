let done = ignore

module A = {
   include Belt.Array

   let join = Js.Array2.joinWith

   let toList = (a: array<'a>): list<'a> =>
      a->Belt.List.fromArray
}

module Djs = Discord

module L = {
   include Belt.List
}

module O = {
   include Belt.Option
}

module P = {
   let map = Promise.then
   let flatmap = Promise.thenResolve
}

module String = {
   include Js.String2
}