type db

type collection<'a> = {name: string}

type find<'a> = ({..} as 'a) => string

let find: find<_> = x => "foo"

type query<'a> = {
  find: 'q. ({..} as 'q) => promise<option<'a>>,
  findOne: 'q. ({..} as 'q) => promise<option<'a>>,
}

type workout = {id: string}

let workouts: collection<workout> = {name: "workouts"}

let queries = (coll: collection<'a>) => {
  find: q => Promise.resolve(None),
  findOne: q => Promise.resolve(None),
}
