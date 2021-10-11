<script lang='ts'>
  export let value = '';
  export let name = '';
  export let label = '';
  export let error = '';
  export let placeholder = '';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let touchTimeout : ReturnType<typeof setTimeout> | undefined;

  const handleInput = (e: Event) => {
    const value = (<HTMLInputElement>e.target).value;
    dispatch('input', value);

    // internal state
    modified = true;
    if (!touched) {
      touchTimeout && clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => { touched = true; }, 1000);
    }
  }

  const handleBlur = () => {
    touched = true;
    touchTimeout && clearTimeout(touchTimeout);
  }

  // If the user has blurred this text field
  let touched = false;

  // If the user has typed at all 
  let modified = false;

  $: visibleError = (touched && modified) ? error : '';
</script>

<fieldset id={name} class='mb-2'>
  {#if label.length}
    <label for={name}>{label}</label>
  {/if}

  <input 
    {name} {placeholder} 
    type='text'
    class:is-error={visibleError}  
    on:input={handleInput} 
    on:blur={handleBlur}
    bind:value={value}/>

  {#if visibleError}
    <div class='is-error message'>
      {visibleError}
    </div>
  {/if}
</fieldset>

<style>
  .is-error.message { 
    padding-left: 0.5rem;
    font-size: 1rem;

    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    column-gap: 0.25em;
    padding-top: 0.25em;
  }
</style>