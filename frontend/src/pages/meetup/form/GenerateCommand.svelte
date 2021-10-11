<script context='module' lang='ts'>
  import type { Store } from '../store';
  import { DateTime } from 'luxon';
  import YAML from 'yaml';

  const buildCommand = (store: Store) : string => {
    const output : Record<string, unknown> = {};

    output.title = store.title;
    output.date = DateTime.fromISO (store.date).toUTC ().toISO ();

    if (store.description)
      output.description = store.description;
    
    if (store.location) {
      output.location_type = store.location.type;
      output.location = store.location.value;

      if (store.location.comments)
        output.location_comments = store.location.comments;
    }

    const validLinks = Array
      .from (store.links.values ())
      .filter (link => link.url.length)
      .map (({ id, ...link }) => link); // omit ID

    if (validLinks.length)
      output.links = validLinks;

    return '!meetup create' + '\n' + YAML.stringify (output);
  }
</script>


<script lang='ts'>
  import { store, errors } from '../store';
  import Textarea from '../components/Textarea.svelte';

  let open = false;

  const openModal = () => { open = true; }
  const close = () => { open = false; }

  $: command = buildCommand ($store);
</script>


<footer name='generate' class='pad-under'>
  <button class='pad mt-2' on:click|preventDefault={openModal} disabled={!$errors.valid}>
    Generate
  </button>

  {#if !$errors.valid}
    <p class='subtext muted mt-1'>
      (you have some errors in the form)
    </p>
  {/if}
</footer>

{#if open}
  <aside on:click|self={close}>
    <div class='generate modal pad'>
      <header>
        <h2>Create Your Meetup!</h2>
        <button class='ghost' on:click|preventDefault={close}>
          <i class='material-icons'>close</i>
        </button>
      </header>

      <p class='pad-v'>
        Here is your meetup command! All you need to do next is copy & paste this command into any channel. Try to pick a channel that's most relevant to the meetup!
      </p>

      <Textarea readonly={true} value={command} rows={10}/>
    </div>
  </aside>
{/if}


<style>
  h2 {
    font-size: 1rem;
  }

  .subtext {
    text-align: center;
    font-size: 0.8rem;
  }

  header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media only screen and (min-width: 640px) {
    footer {
      padding: 0;
    }  
  }
</style>