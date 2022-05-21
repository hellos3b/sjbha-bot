<script lang='ts'>
  export let value = false;
  export let name = '';
  export let label = '';

  const onClick = () => {
    value = !value;
  }

  $: icon = (value) 
    ? "check_box" 
    : "check_box_outline_blank";

  $: active = (value)
    ? true
    : false;

</script>

<fieldset id={name} class='mt-1 mb-2' on:click={onClick}>
  <span class="material-icons check" class:active>
    {icon}
  </span>

  <span class='label'>
    {label}
  </span>
</fieldset>

<style>
  fieldset {
    display: flex;
    align-items: center;
    grid-gap: 12px;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
  }

  fieldset:hover {
    color: var(--primary);
  }

  fieldset .check {
    color: var(--border);
  }

  fieldset .check.active {
    color: var(--text);
  }
</style>