import * as urls from "../urls";
import { useEffect, useState } from 'preact/hooks';
import {authHeaders} from "../auth";
import Form from "./form";
import Logo from "./logo";

const fetchHR = () => {
  return fetch(urls.HR, {headers: authHeaders()})
    .then(r => {
      if (r.status === 200) return r.json();
      throw r;
    })
}

const Screens = {
  LOADING: "loading",
  SETTINGS: "settings",
  UNAUTHORIZED: "unauthorized"
};

const Settings = () => {
  const [screen, setScreen] = useState(Screens.LOADING);
  const [maxHR, setMaxHR] = useState(0);
  
  useEffect(() => {
    fetchHR()
      .then(res => {
        setMaxHR(res.heartrate);
        setScreen(Screens.SETTINGS);
      })
      .catch(err => {
        setScreen(Screens.UNAUTHORIZED);
        // window.location = urls.l
      })
  }, [])

  return (
    <div className="container">
      <Logo/>

      {screen === Screens.LOADING && <Loading/>}
      {screen === Screens.UNAUTHORIZED && <Unauthorized/>}
      {screen === Screens.SETTINGS && <Form maxHR={maxHR}/>}
    </div>
  );
}

const Unauthorized = () => (
  <div>
    <h4>Not Logged In</h4>
    <p>You aren't currently logged in. To log back in, you can use <b style={{color: "green"}}>!fit auth</b> again, or find the link in your DMs</p>
  </div>
)

const Loading = () => (
  <p style={{textAlign:"center", color: "#ccc"}}>Loading</p>
)

export default Settings;