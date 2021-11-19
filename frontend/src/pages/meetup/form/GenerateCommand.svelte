<script context='module' lang='ts'>
  import type { Store } from '../store';
  import { DateTime } from 'luxon';
  import YAML from 'yaml';

  const buildCommand = (store: Store) : string => {
    const output : Record<string, unknown> = {};

    output.title = store.title;
    output.date = DateTime.fromISO (store.date).toUTC ().toISO ();
    output.category = store.category;

    if (store.description)
      output.description = store.description;
    
    if (store.location) {
      output.location = store.location;
      output.location_comments = store.location_comments;
      output.location_linked = store.location_linked;
    }

    const validLinks = Array
      .from (store.links.values ())
      .filter (link => link.url.length)
      .map (({ id, ...link }) => link); // omit ID

    if (validLinks.length)
      output.links = validLinks;

    return (store.id)
      ? `!meetup edit\n${YAML.stringify(output)}`
      : `!meetup create\n${YAML.stringify(output)}`;
  }
</script>


<script lang='ts'>
  import { store, errors } from '../store';
  import Textarea from '../components/Textarea.svelte';

  let open = false;
  let copied = false;

  const openModal = () => { open = true; }
  const close = () => {
    copied = false; 
    open = false; 
  }

  $: command = buildCommand ($store);

  $: helpText = ($store.id)
    ? "Here is your meetup command! All you need to do next is copy & paste this command into any channel. Try to pick a channel that's most relevant to the meetup!"
    : "Here is your edit command! To update your meetup, just copy & paste this text into the meetup's thread.";

  const copyToClipboard = () => {
    var sampleTextarea = document.createElement("textarea");
    document.body.appendChild(sampleTextarea);
    sampleTextarea.value = command; //save main text in it
    sampleTextarea.select(); //select textarea contenrs
    document.execCommand("copy");
    document.body.removeChild(sampleTextarea);

    copied = true;
  }
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
        {helpText}
      </p>

      <Textarea readonly={true} value={command} rows={10}/>

      {#if copied}
        <p class='copied pad-v'>Copied to Clipboard!</p>
      {/if}

      <button class='flex pad mt-2' on:click|preventDefault={copyToClipboard}>
        <span class="material-icons">
          content_copy
        </span>
        Copy to Clipboard
      </button>
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

  .copied { color: var(--primary); }

  .flex {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 12px;
  }

  @media only screen and (min-width: 640px) {
    footer {
      padding: 0;
    }  
  }
</style>