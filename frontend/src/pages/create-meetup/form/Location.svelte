<script lang='ts'>
  import { Option, Vector } from 'prelude-ts';
  import { LocationType, address, privateAddress, voiceChat } from './LocationType';
  import {store, Location} from '../store';

  import Legend from '../components/Legend.svelte';

  import LocationTypeMenu, { openLocationTypeMenu } from './LocationTypeMenu.svelte';
  import LocationFields from './LocationFields.svelte';

  const changeType = (type: LocationType) : void => store.set ('location', Location (type.id));
  const updateLocation = (location: Location) => store.set ('location', location);
  const reset = () => store.set('location', null);

  const locationTypes = Vector.of (address, privateAddress, voiceChat);

  $: selected = Option
    .ofNullable ($store.location)
    .flatMap (a => locationTypes.find (b => a.type === b.id));

  $: icon = selected
    .map (l => l.icon)
    .getOrElse ('place');

  $: title = selected
    .map (l => l.name)
    .getOrElse ('Set a location');
  
  $: active = selected.isSome();

</script>


<section name='location'>
  <Legend {icon} {title} {active} closeable={true} on:click={openLocationTypeMenu} on:close={reset} />
  <LocationTypeMenu on:select={e => changeType (e.detail)}/>

  {#if $store.location}
    <LocationFields selected={$store.location} on:input={e => updateLocation (e.detail)}/>
  {/if}
</section>