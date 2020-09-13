import {Options, useSettingsStore} from './store';
import * as urls from "../urls";

const submit = (hr: number) => {
  const token = localStorage.getItem("auth-token");
  const discordId = localStorage.getItem("discordId");

  const payload = {discordId, hr};

  return fetch(urls.UPDATE_HR, {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(r => {
    if (r.status === 200) return;

    const err = r.json();
    throw err;
  })
}

const Settings = () => {
  const [state, dispatch] = useSettingsStore();

  // Used to toggle between the option forms
  const isSelected = (id: string) => state.option === id;
  // notify the store that an option was selected
  const selectOption = (option: string) => dispatch({type: "SELECT_OPTION", option});

  const optOut = () => dispatch({type: "OPT_OUT"});

  // EVT for typing into the age input
  const onAgeInput = (evt: any) => {
    const age = +evt.currentTarget.value;
    dispatch({type: "INPUT_AGE", age});
  }

  const onHRInput = (evt: any) => {
    dispatch({type: "INPUT_HR", hr: +evt.currentTarget.value});
  }

  const saveHR = (e) => {
    e.preventDefault();

    if (state.heartrate !== 0 && state.heartrate < 170 || state.heartrate > 220) {
      dispatch({
        type: "DISPLAY_ERROR", 
        error: "Heartrate seems out of range. If you're sure about it, send @s3b a DM to set it manually"
      })
      return;
    }

    dispatch({type: "REQUEST_START"});
    submit(state.heartrate)
      .then(() => dispatch({type: "REQUEST_SAVED"}))
      .catch(error => dispatch({type: "DISPLAY_ERROR", error}))
  }

  const disabled = state.state === "loading";
  
  // lets lighten everything up when it's disabled
  const fontColor = disabled ? "#666666" : "inherit";

  return (
  <div className="container">
    <Logo/>

    <h2> Heartrate Settings </h2>

    <p>
      The new <code>!fit</code> command uses heart rate data to calculate EXP when an activity is recorded. 
      In order for that to work, the bot needs to know your max heartrate. Choose an option below
    </p>

    <h4>Set your Max Heartrate</h4>

    <form style={{color: fontColor}} onSubmit={saveHR}>
      {/** Radio Options */}
      <span onClick={() => selectOption(Options.AGE)}>
        <input type="radio" checked={isSelected(Options.AGE)} disabled={disabled}/> <strong>Base on Age</strong>
      </span>

      <p>
        The simplest option, uses a generic equation that goes off of your age. 
      </p>

          
      <span onClick={() => selectOption(Options.MANUAL)}>
        <input type="radio" checked={isSelected(Options.MANUAL)} disabled={disabled}/> <strong>Enter Manually</strong>
      </span>

      <p>If you know your max heartrate</p>

      <span onClick={() => optOut()}>
        <input type="radio" checked={isSelected(Options.IGNORE)} disabled={disabled}/> <strong>Do not use heartrate</strong>
      </span>

      <p>
        Opt out of heartrate based exp. This will treat your activities all as "moderate" and may net in less exp for tougher workouts
      </p>

      <hr/>

      {/** Form Input */}
      {isSelected(Options.AGE) && (
        <div>
          <strong>Age</strong> <input type="number" placeholder="30" style={{width: "5em"}} onInput={onAgeInput} disabled={disabled}/>
          
          <br/>

          <strong>Max Heartrate:</strong> {state.heartrate}
        </div>
      )}

      {isSelected(Options.MANUAL) && (
        <div>
          <label>Heartrate</label>
          <input type="number" placeholder="190" style={{width: "5em"}} onInput={onHRInput} disabled={disabled}/>
        </div>
      )}

      {isSelected(Options.IGNORE) && (
        <p>
          Opting out of heartrate.
        </p>
      )}

      <br/>

      {state.state === "error" && <p style={{color: "red"}}>{state.error}</p>}
      {state.state === "success" && <p style={{color: "green"}}>Your settings have been saved!</p>}

      <button className="button-primary" type="submit" disabled={disabled}>Save</button>
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