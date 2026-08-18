<script lang="ts">
  import { onMount } from "svelte";
  import { scaleLinear } from "d3-scale";
  import { max } from "d3-array";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  type MaterialRow = {
    Material: string;
    "2005": number;
    "2024": number;
    Cambio: number;
  };

  let materialesData: MaterialRow[] = []; 
  let sortedData: MaterialRow[] = [];
  $: data = materialesData; 
  $: if (materialesData.length > 0 && sortedData.length === 0) {
      sortedData = [...data].sort((a, b) => b.Cambio - a.Cambio);
  }
  let sortOrders: Record<keyof Omit<MaterialRow, "id">, "asc" | "desc"> = {
    Material: "asc",
    "2005": "asc",
    "2024": "asc",
    Cambio: "asc",
  };

  let width = 0;
  const rowHeight = 50;
  const margin = { top: 10, right: 90, bottom: 30, left: 70};
  const offset = 8;
  const axisSpace = 30;
  
  let currentPage = 0;
  const pageSize = 10;
  const progress = tweened(0, {
    duration:1000,
    easing:cubicOut
  });
  
  $: visibleData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  $: height = pageSize * rowHeight + margin.top + margin.bottom;
  $: x = scaleLinear()
        .domain([0, max(data, d=> Math.max(d["2005"], d["2024"])) || 100])
        .range([0, width - margin.right]);
  $: totalPages = Math.ceil(sortedData.length / pageSize);
  $: {
    if (visibleData){
      progress.set(0, {duration: 0});
      progress.set(1)
    }
  };
  $: ticks = x.ticks(5).slice(2,10);

  
  function nextPage() {
    if (currentPage < totalPages - 1) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
    }
  }

  function toggleOrder() {
    sortOrders.Cambio = sortOrders.Cambio === "asc" ? "desc" : "asc";
    sortedData = sortedData.sort((a, b) => {
      return sortOrders.Cambio === "asc" 
        ? a.Cambio - b.Cambio 
        : b.Cambio - a.Cambio;
    });
    currentPage = 0; 
  }

  onMount(async () => {
    const res = await fetch("/datos/materiales.json");
    materialesData = await res.json();
  });
</script>

<div class="controls-wrapper">
  <p>
    Con base 100 en
    <b style="color: var(--color-dark-blue)">2005</b> y
    <b style="color: var(--color-orange-corp)">2024</b>
  </p>
  <button on:click={toggleOrder}>
    <span>Cambio</span>
    <span style="font-size: 1rem;">
      {sortOrders.Cambio === 'asc' ? '↑' : '↓'}
    </span>
  </button>

  <div class="pagination">
    <button on:click={prevPage} disabled={currentPage === 0}>
      ‹
    </button>
    
    <span>{currentPage + 1} de {totalPages}</span>
    
    <button on:click={nextPage} disabled={currentPage === totalPages - 1}>
      ›
    </button>
  </div>
</div>

<div bind:clientWidth={width}>
  <svg {width} {height}>
    <g 
      class="axis"
      transform="translate({margin.left}, {margin.top})"
    >
    {#each ticks as tick}
      <g transform="translate({x(tick)}, 0)">
        <line 
          y1=0
          y2={height - margin.top - margin.bottom}
          stroke="var(--color-gray-light)"
          stroke-width=".8"
        />
        <text
          y="15"
          text-anchor="middle"
          style="font-size: 12px; fill: #ccc;"
        >
          {tick}
        </text>
      </g>
    {/each}
    </g>
    {#each visibleData as material, i (material.Material)}
    {@const x1 = x(material["2005"])}
    {@const x2_final = x(material["2024"])}
    <g transform="translate({margin.left}, {i * rowHeight + margin.top + axisSpace})">
      <text 
        x={-margin.left} 
        y={rowHeight /2} 
        dominant-baseline="middle"
        style="font-weight: 500;
        font-size: .9rem;"
        class="material-label"
      >
        {#if material.Material.length <= 27}
          {material.Material}
        {:else}
          {#each material.Material.split(" ") as palabra, index}
            <tspan
              x={-margin.left }
              dy={index === 0 ? "-0.4em" : ".9rem"}
            >
            {palabra}
            </tspan>
          {/each}
        {/if}
      </text>
      <line 
        x1={x1}
        x2={x1 + (x(material["2024"])-x1) * $progress}
        y1={rowHeight/2}
        y2={rowHeight/2}
        stroke="grey"
        stroke-width="10"
        opacity="0.2"
      />
      <circle
        cx={x(material["2005"])}
        cy={rowHeight/2}
        r="7"
        fill="var(--color-dark-blue)"
      />
      <circle
        cx={x1 + (x2_final - x1) * $progress}
        cy={rowHeight/2}
        r="7"
        fill="var(--color-orange-corp)"
      />
      <text
        x={x(material["2005"]) - offset *3}
        y={rowHeight /2}
        dominant-baseline="middle"
        style="font-size: 14px;"
      >
        {Math.round(material["2005"])}
      </text>
      <text
        x={x(material["2024"]) + offset}
        y={rowHeight /2}
        dominant-baseline="middle"
        style="font-size: 14px;"
      >
        {Math.round(material["2024"])}
      </text>
    </g> 
    {/each}
  </svg>
</div>

<style>
/* Contenedor general de controles */
.controls-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 15px;
  font-family: sans-serif;
}

/* Paginación más compacta */
.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #999;
}

.pagination button {
  padding: 4px 8px; /* Más pequeños que el de ordenar */
}

p {
  margin:auto 0;
  font-size: 0.9rem;
  font-family: var(--font-secondary);
}
@media (max-width:768px) {
  p{
    font-size: 0.9rem;
  }
}
  
</style>
