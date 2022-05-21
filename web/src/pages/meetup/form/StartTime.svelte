<script lang='ts'>
  import { DateTime } from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import Banner from '../components/Banner.svelte';

  const dispatch = createEventDispatcher();
  export let value = '';

  export let error = '';

  const minDate = DateTime.local().toISODate();

  $: datetime = DateTime.fromISO (value);
  $: day = datetime.toISODate();
  $: time = datetime.toLocaleString (DateTime.TIME_24_SIMPLE);

  const setDate = (e: Event) => {
    const value = (<HTMLInputElement>e.target).value;
    value && dispatch ('input', `${value}T${time}`);
  }

  const setTime = (e: Event) => {
    const value = (<HTMLInputElement>e.target).value;
    value && dispatch ('input', `${day}T${value}`);
  }
</script>


<fieldset id='datetime' class='mb-2 mt-2'>
  <div class='inputs'>
    <div>
      <label for="date">Date</label>
      <input type="date" name="date" class:is-error={error} min={minDate} value={day} on:input={setDate}/>
    </div> 

    <div>
      <label for="time">Starts At</label>
      <input type='time' name="time" class:is-error={error} value={time} on:input={setTime}/>
    </div>
  </div>

  {#if error}
    <div class='mt-2'>
      <Banner>{error}</Banner>
    </div>
  {/if}
</fieldset>


<style>
  .inputs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 1rem;
    align-items: center;
  }
</style>