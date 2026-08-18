<script lang="ts">
  import { extent, max } from "d3-array";
  import { stack, area } from "d3-shape";
  import { scaleLinear, scaleOrdinal } from "d3-scale";
  import type { SeriesPoint } from "d3-shape";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from "svelte";

  type MaterialRow = {
    Año: number;
    Española: number;
    Europa: number;
    "América Latina": number;
    Resto: number;
  };

  type SerieName = Exclude<keyof MaterialRow, "Año">;

  let rawData: MaterialRow[] = [];

  onMount(async () => {
    const res = await fetch("/datos/perfil_epa.json");
    rawData = await res.json();
  });

  let showSpanish = false;
  let activeCategory: string | null = null;
  let hoveredYear: number | null = null;

  const margin = { top: 20, right: 20, bottom: 40, left: 45 };
  const height = 500;
  let width = 0;

  $: innerWidth = Math.max(0, width - margin.left - margin.right);
  $: innerHeight = height - margin.top - margin.bottom;

  $: yearDomain = (extent(rawData, (d) => d.Año) as [number, number]) || [2008, 2025];

  $: keys = (showSpanish 
    ? ["Española", "Europa", "América Latina", "Resto"] 
    : ["Europa", "América Latina", "Resto"]) as SerieName[];

  $: stackedData = stack<MaterialRow>().keys(keys)(rawData);
  
  $: x = scaleLinear().domain(yearDomain).range([0, innerWidth]);

  $: yMax = max(stackedData, (layer) => max(layer, (d) => d[1])) ?? 0;
  
  const yMaxTweened = tweened(0, { duration: 1000, easing: cubicOut });
  $: yMaxTweened.set(yMax);

  $: y = scaleLinear().domain([0, $yMaxTweened]).range([innerHeight, 0]).nice();

  $: areaGen = area<SeriesPoint<MaterialRow>>()
    .x((d) => x(d.data.Año))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  $: xTicks = width > 768 ? x.ticks(6) : x.ticks(4);
  $: yTicks = y.ticks(4);

  // Unificamos hoveredData en una sola declaración reactiva
  $: hoveredData = (hoveredYear !== null && rawData.length > 0)
    ? rawData.find(d => Math.abs(d.Año - Math.round(hoveredYear!)) < 0.5)
    : null;

  const colorScale = scaleOrdinal<SerieName, string>()
    .domain(["Española", "Europa", "América Latina", "Resto"])
    .range(["#ED6F2A", "#003443", "#5C7D87", "#BDCACD"]);

  const formatEuropean = (v: number) =>
    v.toLocaleString("de-DE", {
      maximumFractionDigits: 0,
    });

  function toggleCategory(key: string) {
    activeCategory = activeCategory === key ? null : key;
  }
</script>

<div class="graphic-container">
  <button on:click={() => (showSpanish = !showSpanish)} class="graphic-btn">
    {showSpanish ? "Ocultar Española" : "Añadir Española"}
  </button>

  <div class="chart-wrapper" bind:clientWidth={width}>
    {#if width > 0}
      <svg {width} {height}>
        <g transform="translate({margin.left}, {margin.top})">
          {#each yTicks as tick}
            <g transform="translate(0,{y(tick)})">
              <line x2={innerWidth} stroke="#eee" stroke-width="1" />
              <text x="-10" dy="0.32em" text-anchor="end" class="tick-label">{formatEuropean(tick)}</text>
            </g>
          {/each}

          {#each xTicks as tick}
            <text x={x(tick)} y={innerHeight + 25} text-anchor="middle" class="tick-label">{tick}</text>
          {/each}

          {#each stackedData as layer (layer.key)}
            <path
              d={areaGen(layer)}
              fill={colorScale(layer.key as SerieName)}
              fill-opacity={activeCategory === null || activeCategory === layer.key ? 1 : 0.2}
              on:click={() => toggleCategory(layer.key)}
              style="cursor: pointer; transition: fill-opacity 0.3s;"
            />
          {/each}

          {#if hoveredData}
            <line 
              x1={x(hoveredData.Año)} x2={x(hoveredData.Año)} 
              y1={10} y2={innerHeight} 
              stroke="#666666"   stroke-width=.1
            />
          {/if}

          <rect
            width={innerWidth} height={innerHeight}
            fill="transparent"
            on:mousemove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              hoveredYear = x.invert(e.clientX - rect.left);
            }}
            on:mouseleave={() => (hoveredYear = null)}
          />
        </g>
      </svg>

      {#if hoveredData}
        <div 
          class="simple-tooltip"
          style="
            top: {margin.top}px;
            left: {x(hoveredData.Año) + margin.left}px;
            transform: translate({x(hoveredData.Año) > innerWidth / 2 ? '-110%' : '10%'}, 0);
          "
        >
          <div class="tooltip-year">{hoveredData.Año}</div>
          {#each keys.slice().reverse() as key}
            <div class="tooltip-row">
              <span class="dot" style="background-color: {colorScale(key)}"></span>
              <span class="label">{key}:</span>
              <span class="value">{formatEuropean(hoveredData[key])}</span>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .graphic-container { font-family: sans-serif; }
  
  .chart-wrapper { 
    position: relative; 
    margin-top: 20px;
  }

  .tick-label { font-size: 12px; fill: #666; }

  .simple-tooltip {
    position: absolute;
    padding: 8px 12px;
    pointer-events: none;
    z-index: 10;
    min-width: 140px;
  }

  .tooltip-year { font-weight: bold; margin-bottom: 4px; }
  
  .tooltip-row { 
    display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 4px; 
  }

  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .label { flex-grow: 1; color: #666; }
  .value { font-weight: bold; }

  .graphic-btn {
    padding: 6px 12px;
    cursor: pointer;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>