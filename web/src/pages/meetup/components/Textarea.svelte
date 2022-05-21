<script lang='ts'>
  export let value = '';
  export let name = '';
  export let label = '';
  export let placeholder = '';
  export let readonly = false;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  const handleInput = (e: Event) => {
    const value = (<HTMLInputElement>e.target).value;
    dispatch('input', value);
  }

  export let rows = 4;

  export let limit = 0;

  $: hasLimit = limit > 0;
  $: charactersLeft = limit - value.length;
  $: overLimit = hasLimit && charactersLeft <= 0;
</script>

<fieldset id={name}>
  {#if label}
    <label for={name} class:is-error={overLimit}>{label}</label>
  {/if}

  <textarea {name} {placeholder} {readonly} {rows} 
    on:click 
    on:input={handleInput} 
    bind:value={value}
    class:error={overLimit}/>

  <div class='character-count' class:red={overLimit}>
    {#if hasLimit && !overLimit}
      {limit - value.length}
    {:else if overLimit}
      Maximum {limit} characters (<b>{Math.abs(charactersLeft)}</b> too many)
    {/if}
  </div>
</fieldset>

<style>
  textarea {
    font-family: 'Lato', sans-serif;
    
    width: 100%;
    font-size: 1rem;

    padding: 0.75rem 0.5rem;

    color: var(--text);
    background-color: var(--background);
    outline: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    
    resize: vertical;
    min-height: 6rem;
    line-height: 1.4em;
  }


  textarea.error:focus {
    outline-color: var(--danger);
  }

  textarea:focus {
    background-color: var(--input-focus);
    outline-color: var(--primary);
  }

  textarea.error {
    border: 1px solid var(--danger);
    background-color: var(--danger-input-focus);
  }

  .character-count {
    margin-right: 0.5rem;
    text-align: right;
    color: var(--muted);
    font-weight: 300;
  }

  .red {
    color: var(--danger);
  }
</style>