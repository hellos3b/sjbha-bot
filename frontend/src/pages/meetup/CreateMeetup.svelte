<script lang='ts'>
  import Details from './form/Details.svelte';
  import Location from './form/Location.svelte';
  import Links from './form/Links.svelte';
  import GuestLimit from './form/GenerateCommand.svelte';
  import GenerateCommand from './form/GenerateCommand.svelte';
  import { fetchMeetup, store } from './store';

  let state : "loading" | "ready" | "could-not-load" = "loading";

  if (window.location.hash) {
    const id = window.location.hash.substr (1);
    
    fetchMeetup (id)
      .then (_ => { state = 'ready'; })
      .catch (_ => { state = 'could-not-load'; });
  }
  else {
    state = "ready";
  }

  $: title = ($store.id) ? '!meetup edit' : '!meetup';

  // Debug logging store updates
  $: console.log ($store);
</script>


<main>
  <h1>{title}</h1>

  {#if state === 'ready'}
    <form autocomplete="off">
      <Details />
      <Location />
      <Links />
      <!-- <GuestLimit /> -->

      <GenerateCommand />
    </form>

  {:else if state === 'loading'}
    <div class='loading'>
      <img src='https://c.tenor.com/HriJ9iilg1QAAAAd/cat-vibe.gif' alt="" width="50%">
      <br/>
      <br/>
      fetching meetup details
    </div>

  {:else if state === 'could-not-load'}
    <div class='error'>
      There was a problem loading the meetup for editing
    </div>

  {/if}
</main>


<style>
  main {
    max-width: 640px;
    margin: 0 auto;
  }

  h1 {
    color: #d08d8d;
    padding: 2rem;
    text-align: center;
    font-size: 3rem;
    font-weight: 300;
    margin-bottom: 1rem;
    letter-spacing: 6px;
  }

  .loading {
    font-size: 1.5rem;
    text-align: center;
    font-weight: 300;
    color: var(--muted);
  }

  .error {
    color: var(--danger);
    text-align: center;
  }
</style>