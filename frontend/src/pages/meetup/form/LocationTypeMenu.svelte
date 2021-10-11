<script context='module'>
  import { writable } from 'svelte/store';

  const isOpen = writable (false);

  export const openLocationTypeMenu = () => {
    isOpen.set (true);
  }
</script>

<script lang='ts'>
  import { fade } from 'svelte/transition';
  import { LocationType, address, privateAddress, voiceChat } from './LocationType';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  type LocationOption = { location: LocationType; description: string; }
  const LocationOption = (location: LocationType, description: string) : LocationOption => ({ location, description });

  const options: LocationOption[] = [
    LocationOption (address, 'A specific location or business'),
    LocationOption (privateAddress, 'You don\'t want the address posted publicy and will let attendees know individually'),
    LocationOption (voiceChat, 'This is a virtual meetup that takes place in voice chat')
  ];

  const close = () => {
    $isOpen = false;
  }

  const handleClick = (location: LocationOption) => () => {
    dispatch('select', location.location);
    close();
  }

</script>

{#if $isOpen}
  <aside on:click|preventDefault={close} in:fade="{{duration: 100}}">
    <menu class='modal'>

      {#each options as option (option.location.id)}
        <li on:click={handleClick(option)}>
          <i class='material-icons'>{option.location.icon}</i> 
          <strong>{option.location.name}</strong>
          <small class='muted'>{option.description}</small>
        </li>
      {/each}

    </menu>
  </aside>
{/if}

<style>
  menu {
    color: var(--text);
    font-size: 16px;
    padding: 0;
  }

  li {
    cursor: pointer;
    list-style-type: none;
    padding: 1rem;

    display: grid;
    column-gap: 0.5rem;
    row-gap: 0.5rem;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
  }

  li:hover {
    background: var(--background-muted);
  }

  strong {
    grid-row: 1;
    grid-column: 2;
    line-height: 1.25rem;
  }

  small {
    grid-row: 2;
    grid-column: 2;
  }

  .material-icons {
    font-size: inherit
  }
</style>