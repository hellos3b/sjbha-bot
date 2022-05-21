<script lang='ts'>
  import { createEventDispatcher } from 'svelte';

  export let active = false;

  export let icon = '';

  export let title = '';

  export let closeable = false;

  const dispatch = createEventDispatcher ();

  const click = () => dispatch('click');
  const close = () => dispatch('close');
</script>


<legend class:muted={!active}>
  <button class='toggle' disabled={active} on:click|preventDefault={click}>
    <i class='material-icons'>{icon}</i>
    {title}
  </button>

  {#if active && closeable}
    <button class='ghost' on:click|preventDefault={close}>
      <i class='material-icons'>close</i>
    </button>
  {/if}
</legend>


<style>
  legend {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  legend.muted button {
    color: var(--muted);
    font-weight: 300;
  }

  button.toggle {
    text-align: left;
    padding: 1.5rem 1rem;
    font-size: 18px;

    background: transparent;
    color: var(--dark);
    font-weight: 400;
    
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 1rem;
    align-items: center;
  }

  button.toggle:focus {
    color: var(--primary);
  }

  button.toggle:disabled {
    cursor: default;
    opacity: 1;
  }
</style>