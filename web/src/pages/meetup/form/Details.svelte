<script lang='ts'>
  import {store, errors, MAX_DESCRIPTION_LENGTH} from '../store';

  import Legend from '../components/Legend.svelte';
  import Textfield from '../components/Textfield.svelte';
  import Textarea from '../components/Textarea.svelte';
  import Category from '../components/Category.svelte';
  
  import StartTime from './StartTime.svelte';

  const categories = [
    { label: 'default', emoji: '🗓️' },
    { label: 'food', emoji: '🍔' },
    { label: 'drinks', emoji: '🍺' },
    { label: 'fitness', emoji: '💪' },
    { label: 'voice', emoji: '🔊' },
    { label: 'gaming', emoji: '🎮' },
    { label: 'outdoors', emoji: '🌲' },
    { label: 'concert', emoji: '🎵' },
    { label: 'holiday', emoji: '🎉' },
    { label: 'volunteer', emoji: '🎗️' },
    { label: 'pet', emoji: '🐕' }
  ];
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

    <label for='categories'>Category</label>
    <div class='categories'>
      {#each categories as category (category.label)}
        <Category 
          emoji={category.emoji} 
          label={category.label}
          selected={category.label === $store.category}
          on:click={() => store.set ('category', category.label)}
          />
      {/each}
    </div>
  </fieldset>  
</section>

<style>
  .categories {
    margin-top: 12px;
  }
</style>