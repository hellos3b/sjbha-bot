export const unique = <a>(): ((a: a) => boolean) => {
   const used = new Set<a> ();
   return a => {
      if (used.has (a)) return false;
      used.add (a);
      return true;
   };
};