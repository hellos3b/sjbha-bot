export class SubConflict extends Error {
  name = "SubConflict";

  constructor(message: string) {
    super(message);
  }
}

export class BadArgs extends Error {
  name = this.constructor.name;
  
  constructor(message: string) {
    super(message);
  }
}

export class MissingSub extends Error {
  name = this.constructor.name;
  
  constructor(message: string) {
    super(message);
  }
}