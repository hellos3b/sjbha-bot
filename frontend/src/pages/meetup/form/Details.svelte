<script lang='ts'>
  import {store, errors, MAX_DESCRIPTION_LENGTH} from '../store';

  import Legend from '../components/Legend.svelte';
  import Textfield from '../components/Textfield.svelte';
  import Textarea from '../components/Textarea.svelte';
  
  import StartTime from './StartTime.svelte';
</script>

<section name='details'>
  <Legend icon='notes' title='Details' active={true} />

  <fieldset class='pad-under'>
    <Textfield 
      label='Meetup title' 
      name='title'
      error={$errors.get('title')}
      bind:value={$store.title}/>

    <StartTime 
      error={$errors.get('date')}
      value={$store.date}
      on:input={e => store.set('date', e.detail)}/>

    <Textarea 
      label='Meetup description'
      name="description" 
      placeholder="Let people know what this meetup is all about!" 
      limit={MAX_DESCRIPTION_LENGTH} 
      rows={8}
      bind:value={$store.description}/>
  </fieldset>  
</section>