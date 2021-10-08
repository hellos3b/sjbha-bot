<script lang='ts'>
  import Details from './form/Details.svelte';
  import Location from './form/Location.svelte';
  import Links from './form/Links.svelte';
  import GuestLimit from './form/GenerateCommand.svelte';
  import GenerateCommand from './form/GenerateCommand.svelte';
</script>


<main>
  <h1>!meetup</h1>

  <form autocomplete="off">
    <Details />
    <Location />
    <Links />
    <!-- <GuestLimit /> -->

    <GenerateCommand />
  </form>
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
</style>