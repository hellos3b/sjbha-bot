import "./styles.css";

import { render as renderApp } from 'preact';
import { Router, Route } from 'preact-router';

import Help from "./help/help";
import Login from "./login/login";
import Settings from "./settings/settings";
import MissingPage from "./missingpage/missingpage";
import { useEffect } from "preact/hooks";
import * as urls from "./urls";


const Main = () => {
  useEffect(() => {
    document.title = "Fit";
  }, []);

  return (
    <Router>
      <Route path={urls.HELP} component={Help}/>
      <Route path={urls.SETTINGS} component={Settings}/>
      <Route path={urls.LOGIN} component={Login}/>

      <Route default component={MissingPage}/>
    </Router>
  )
}

export function render() {
  renderApp(<Main/>, document.body)
}