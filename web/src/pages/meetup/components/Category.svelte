<script lang='ts'>
  export let emoji = '🗓️';

  export let label = 'default';

  export let selected = false;
</script>

<div class='category' class:selected on:click>
  <div class='emoji'>{emoji}</div>
  <div class='label'>{label}</div>
</div>

<style>
  .category {
    display: inline-flex;
    grid-gap: 12px;
    align-items: center;
    border: 1px solid var(--border);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;

    color: var(--muted);
  }

  .category:hover {
    color: var(--primary);
    border-color: var(--primary);
  }

  .category.selected {
    color: var(--text);
    border-color: var(--text);
    background: var(--background-muted);
  }
</style>