import { useReducer } from 'preact/hooks';

export const States = {
  EDIT: "edit",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
};

export const initialState = {
  state: States.EDIT,
  error: "",
  opt_out: false,
  heartrate: 0
}

export type State = typeof initialState;

export type Actions = |
  {type: "TOGGLE_OPT_OUT", isChecked: boolean} |
  {type: "INPUT_HR", hr: number} |
  {type: "DISPLAY_ERROR", error: string} |
  {type: "REQUEST_START"} |
  {type: "REQUEST_SAVED"};

export const useSettingsStore = (state: Partial<State> = {}) => useReducer<State, Actions>((state: State, action: Actions): State => {
    switch (action.type) {

    case "TOGGLE_OPT_OUT": return {
      ...state,
      opt_out: action.isChecked,
      state: States.EDIT
    };
  
    case "INPUT_HR": return {
      ...state,
      heartrate: action.hr,
      error: "",
      state: States.EDIT
    };
  
    case "DISPLAY_ERROR": return {
      ...state,
      error: action.error,
      state: States.ERROR
    };

    case "REQUEST_START": return {
      ...state,
      state: States.LOADING
    };

    case "REQUEST_SAVED": return {
      ...state,
      state: States.SUCCESS
    };

    default: return state;
  
    }
}, {...initialState, ...state});