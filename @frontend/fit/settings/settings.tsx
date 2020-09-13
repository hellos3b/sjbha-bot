import {useSettingsStore} from './store';
import * as urls from "../urls";
import { useEffect } from 'preact/hooks';

const authHeaders = () => ({
  "Authorization": localStorage.getItem("auth-token"),
  "Content-Type": "application/json"
})

const submit = (hr: number) => {
  const discordId = localStorage.getItem("discordId");
  const payload = {discordId, hr};

  return fetch(urls.HR, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => {
    if (r.status === 200) return;

    r.json().then(err => {
      throw err
    })
  })
}

const Settings = () => {
  const [state, dispatch] = useSettingsStore();

  useEffect(() => {
    fetch(urls.HR, {headers: authHeaders()})
      .then(r => r.json())
      .then(res => {
        dispatch({type: "ON_FETCH_SETTINGS", hr: res.heartrate});
      })
  }, [])

  const onHRInput = (evt: any) => {
    dispatch({type: "INPUT_HR", hr: +evt.currentTarget.value});
  }

  const onCheckOptOut = (evt: any) => {
    dispatch({type: "TOGGLE_OPT_OUT", isChecked: evt.currentTarget.checked})
  }

  const saveHR = (e) => {
    e.preventDefault();

    if (!state.opt_out && state.heartrate < 170 || state.heartrate > 220) {
      dispatch({
        type: "DISPLAY_ERROR", 
        error: "Heartrate realistically should be between 170-220. If you're sure you put in a valid heartrate, send @s3b a DM to set it manually"
      })
      return;
    }

    const heartrate = state.opt_out ? 0 : state.heartrate;
    dispatch({type: "REQUEST_START"});
    submit(heartrate)
      .then(() => dispatch({type: "REQUEST_SAVED"}))
      .catch(error => dispatch({type: "DISPLAY_ERROR", error}))
  }

  const isLoading = state.state === "loading";
  const disableInputText = isLoading || state.opt_out === true;
  const hrPlaceholder = state.opt_out ? "-" : "190";
  
  // lets lighten everything up when it's disabled
  const fontColor = isLoading ? "#666666" : "inherit";

  return (
  <div className="container">
    <Logo/>

    <h2> Settings </h2>

    <h4>Max Heartrate</h4>

    <form style={{color: fontColor}} onSubmit={saveHR}>
      <strong style={{marginRight: "1em"}}>Max Heartrate:</strong>
      <input 
        type="number" 
        placeholder={hrPlaceholder} 
        style={{width: "5em"}} 
        onInput={onHRInput} 
        value={state.opt_out ? "" : state.heartrate}
        disabled={disableInputText}
        />
      

      <p style={{background: "#eee", padding: "1em"}}>
        <small>Use <b>220-(your age)</b> if you don't know your max heartrate</small>
      </p>

      <br/><br/>
    
      <label>
        <input 
          name="opt-out" 
          type="checkbox" 
          onClick={onCheckOptOut} 
          checked={state.opt_out} 
          disabled={isLoading}
          /> 
        Opt out of heartrate data
      </label>
      {/* <strong>Opt out of heartrate data</strong> */}

      <br/><br/>

      {state.state === "error" && <p style={{color: "red"}}>{state.error}</p>}
      {state.state === "success" && <p style={{color: "green"}}>Your settings have been saved!</p>}

      <button className="button-primary" type="submit" disabled={isLoading}>Save</button>
    </form>

  </div>
  );
}

const Logo = () => (
  <h2 style={{textAlign: "center"}}>
    <img src="https://imgur.com/An9zxCP.jpg" style={{width: "2em"}}/>
    <p>+</p>
    <img src="https://imgur.com/LNBR93w.jpg" style={{width: "3em"}}/>
  </h2>
)

export default Settings;