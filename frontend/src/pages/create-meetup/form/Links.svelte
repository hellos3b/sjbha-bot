<script lang='ts'>
  import { Link, store, errors } from '../store';
  import Legend from '../components/Legend.svelte';
  import Banner from '../components/Banner.svelte';

  $: list = Array.from($store.links.values());

  const addLink = () => {
    const link = Link();
    $store.links = new Map($store.links).set(link.id, link);
  }

  const remove = (id: symbol) => {
    return () => {
      const links = new Map($store.links);
      links.delete (id);
      $store.links = links;
    }
  }

  const handleUrlChange = (link: Link) =>  (e: Event) => {
    const url = (<HTMLInputElement>e.target).value;
    $store.links = new Map($store.links).set (link.id, {...link, url});
  }

  const handleNameChange = (link: Link) => (e: Event) => {
    const name = (<HTMLInputElement>e.target).value;
    $store.links = new Map($store.links).set (link.id, {...link, name})
  }

  $: formOpen = list.length > 0;
  $: legend = formOpen ? "Links" : "Add a link";
</script>

<section name='links'>
  <Legend icon='insert_link' title={legend} active={formOpen} on:click={addLink}/>

  {#if formOpen}
    <p class='pad'>
      You can provide some links to things like an event page, a food menu, a trail map for a hike, etc
    </p>

    <fieldset class='input-grid pad-under'>
      <label for='link-url'>URL</label>
      <label for='link-name'>Link name (optional)</label>
      <div/> <!-- Extra div just so the grid works-->

      {#each list as link (link.id)}
        <input
          type='text' 
          name="link-url" 
          placeholder="https://" 
          value={link.url} 
          class:is-error={$errors.getLink (link.id)}
          on:input={handleUrlChange (link)}/>

        <input 
          type='text'
          name="link-name" 
          value={link.name}
          class:is-error={$errors.getLink (link.id)}
          on:input={handleNameChange (link)}/>
        
        <button class='remove-link ghost' on:click|preventDefault={remove (link.id)}>
          <i class='material-icons'>close</i>
        </button>

        {#if $errors.getLink (link.id)}
          <div class='link-error'>
            <Banner>{$errors.getLink (link.id)}</Banner>
          </div>
        {/if}
      {/each}
    </fieldset>

    <button class='link pad-under mb-2' on:click|preventDefault={addLink}>
      + Add another link
    </button>
  {/if}
</section>

<style>
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }

  /* line the X icon with the input text */
  .remove-link { margin-top: -1rem; }

  .link-error {
    grid-column: 1/4;
  }
</style>