import "regenerator-runtime";
import "./styles.css";

import { render } from 'preact';
import { Router, Route } from 'preact-router';

import Help from "./help/help";
import Login from "./login/login";
import Settings from "./settings/settings";
import MissingPage from "./missingpage/missingpage";


const Main = () => (
  <Router>
    <Route path="/fit/help" component={Help}/>
    <Route path="/fit/settings" component={Settings}/>
    <Route path="/fit/login" component={Login}/>

    <Route default component={MissingPage}/>
  </Router>
)

render(<Main/>, document.body)