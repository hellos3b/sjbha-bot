<script lang='ts'>
  import {store, MAX_LOCATION_COMMENTS_LENGTH} from '../store';

  import Legend from '../components/Legend.svelte';
  import Textarea from '../components/Textarea.svelte';
  import Textfield from '../components/Textfield.svelte';
  import Checkbox from '../components/Checkbox.svelte';
  
  $: console.log ($store.location_linked);
</script>


<section name='location'>
  <Legend icon='place' title='Location' active={true} />
  
  <fieldset class='pad-under'>
    <p class='pad-v'>
      You can enter either an address, a business name, or a general area that the meetup takes place in
    </p>

    <Textfield 
      label="Name or Address" 
      name="location" 
      placeholder="1234 Royroy lane, Hapas Brewing, West San Jose, ..."
      bind:value={$store.location}/>

    <Checkbox
      label="Make location clickable to Google Maps"
      name="autolink"
      bind:value={$store.location_linked}/>

    <Textarea 
      label="Additional comments (optional)" 
      placeholder='Do people need extra instructions for this location? Meeting spots, what to look for'
      limit={MAX_LOCATION_COMMENTS_LENGTH}
      bind:value={$store.location_comments}/>
  </fieldset>
</section>