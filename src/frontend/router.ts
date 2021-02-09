import "regenerator-runtime";

import Navigo from "navigo";

var router = new Navigo();

router
  .on('/fit*', () => {
    import(/* webpackChunkName: "fit" */ './fit/app').then(module => {
      module.render();
    });
  })
  .notFound(() => {
    document.write(JSON.stringify({
      error: "URL passed to frontend router, but no route matches"
    }));
  })
  .resolve();
