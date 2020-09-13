import { useReducer } from 'preact/hooks';

export const Options = {
  AGE: "age",
  MANUAL: "manual",
  IGNORE: "ignore"
};

export const initialState = {
  state: "edit",
  error: "",
  option: Options.AGE,
  age: 30,
  heartrate: 190
}

export type State = typeof initialState;

export type Actions = |
  {type: "SELECT_OPTION", option: string} |
  {type: "OPT_OUT"} |
  {type: "INPUT_AGE", age: number} |
  {type: "INPUT_HR", hr: number} |
  {type: "DISPLAY_ERROR", error: string} |
  {type: "REQUEST_START"} |
  {type: "REQUEST_SAVED"};

export const useSettingsStore = () => useReducer<State, Actions>((state: State, action: Actions): State => {
    switch (action.type) {

    case "SELECT_OPTION": return {
      ...state,
      option: action.option,
      state: "edit"
    };
  
    case "OPT_OUT": return {
      ...state,
      option: Options.IGNORE,
      heartrate: 0,
      state: "edit"
    };
  
    case "INPUT_AGE": return {
      ...state,
      age: action.age,
      heartrate: 220 - action.age,
      error: "",
      state: "edit"
    };
  
    case "INPUT_HR": return {
      ...state,
      heartrate: action.hr,
      error: "",
      state: "edit"
    };
  
    case "DISPLAY_ERROR": return {
      ...state,
      error: action.error,
      state: "error"
    };

    case "REQUEST_START": return {
      ...state,
      state: "loading"
    };

    case "REQUEST_SAVED": return {
      ...state,
      state: "success"
    };

    default: return state;
  
    }
}, initialState);