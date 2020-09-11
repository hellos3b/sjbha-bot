import {createNanoEvents} from "nanoevents";

type Events = {
  "ADD_ACTIVITY": (props: {
    activityId: string
  })=>void;
}

const events = createNanoEvents<Events>();

export default events;