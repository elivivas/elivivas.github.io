<script lang="ts">
  import { onMount } from 'svelte';
  export let height = "80svh";
  
  let isVisible = false;
  let container: any;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        isVisible = true;
        observer.disconnect();
      }
    }, { rootMargin: "1000px" });

    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<div bind:this={container} style="min-height: {height}; width: 100%;">
  {#if isVisible}
    <slot />
  {/if}
</div>