<script context='module' lang='ts'>
  import { LocationType, address, privateAddress, voiceChat} from './LocationType';

  // The textfield labels
  type Input =
    | { enabled: false }
    | { enabled: true, label: string, example: string };

  const NoInput = () : Input => ({ enabled: false });
  const Input = (label: string, example: string) : Input => ({ enabled: true, label, example });

  // Form State
  type State = { location: LocationType; description: string; input: Input; }
  const State = (location: LocationType, description: string, input: Input) => ({ location, description, input });

  const addressState = State (
    address,
    "Enter either the exact address, or something like 'Business Name, San Jose, CA'. The bot will make it link directly to google maps -- no need to paste the link!",
    Input ('Address', 'e.g. 1234 Royroy lane, Original Gravity San Jose')
  );

  const privateState = State (
    privateAddress,
    "Selecting 'Private Address' means you will be responsible of telling people where to go. You should enter a general location so people can take distance into consideration before RSVP-ing",
    Input ('General Area', 'e.g. West San Jose, Near Downtown')
  );

  const voiceState = State (
    voiceChat,
    'Location will mention that this meetup is in voice chat',
    NoInput()
  );

  const findState = (id: string) => 
    Vector.of(addressState, privateState, voiceState)
      .find (s => s.location.id === id);
</script>


<script lang='ts'>
  import { Vector } from 'prelude-ts';
  import { Location, MAX_LOCATION_COMMENTS_LENGTH, errors } from '../store';

  import Textarea from '../components/Textarea.svelte';
  import Textfield from '../components/Textfield.svelte';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let selected: Location;
  
  const setValue = (e: CustomEvent<string>) => dispatch ('input', Location (selected.type, e.detail, selected.comments));
  const setComments = (e: CustomEvent<string>) => dispatch ('input', Location (selected.type, selected.value, e.detail));

  $: state = findState(selected.type).getOrElse (addressState);
</script>


<fieldset class='pad-under'>
  <p class='pad-v'>
    {state.description}
  </p>

  {#if state.input.enabled}
    <Textfield 
      label={state.input.label} 
      name="location" 
      placeholder={state.input.example}
      value={selected.value}
      error={$errors.get('location')}
      on:input={setValue}/>

    <Textarea 
      label="Additional comments (optional)" 
      placeholder='Do people need extra instructions for this location? Meeting spots, what to look for'
      limit={MAX_LOCATION_COMMENTS_LENGTH}
      value={selected.comments}
      on:input={setComments}/>
  {/if}
</fieldset>