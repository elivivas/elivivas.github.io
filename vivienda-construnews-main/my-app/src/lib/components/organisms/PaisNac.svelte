<script lang="ts">
  import { group, max } from "d3-array";
  import { stack, stackOffsetExpand, stackOffsetNone } from "d3-shape";
  import { scaleBand, scaleLinear } from "d3-scale";
  import { onMount } from "svelte";

  type RawData = {
    Tipo: string;
    Año: number;
    España: number;
    Europa: number;
    África: number;
    América: number;
    "Asia.Oceanía": number;
  };

  type WorkerData = {
    Tipo: string;
    Año: number;
    regiones: {
      España: number;
      Europa: number;
      África: number;
      América: number;
      "Asia/Oceanía": number;
    };
  };

  type Region = keyof WorkerData["regiones"];
  type WorkerType = string;

  // --- Estado y Carga ---
  let perfilCenso: RawData[] = [];
  let containerWidth = 800;
  let showSpain = true;
  let percentMode = true;

  onMount(async () => {
    const res = await fetch("/datos/perfil_censo.json");
    perfilCenso = await res.json();
  });

  $: rawData = perfilCenso;

  $: cleanData = rawData.map((d) => ({
    Tipo: d.Tipo,
    Año: d.Año,
    regiones: {
      España: d.España,
      Europa: d.Europa,
      África: d.África,
      América: d.América,
      "Asia/Oceanía": d["Asia.Oceanía"],
    },
  }));

  $: tipos = Array.from(new Set(cleanData.map((d) => d.Tipo)));

  $: dataByTipo = group(cleanData, (d) => d.Tipo) as Map<WorkerType, WorkerData[]>;

  // --- Configuración Visual ---
  const regionColors: Record<Region, string> = {
    España: "#ED6F2A",      
    Europa: "#003443",      
    África: "#5C7D87",       
    América: "#BDCACD",     
    "Asia/Oceanía": "#768b91",
  };

  const margin = { top: 50, right: 10, bottom: 10, left: 40 };
  let height = 450;
  const regions: Region[] = ["España", "Europa", "África", "América", "Asia/Oceanía"];

  $: height = containerWidth > 600 ? 500 : 600;
  $: innerWidth = containerWidth - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: cols = containerWidth > 600 ? 2 : 1;
  $: rows = Math.ceil(tipos.length / cols);
  
  $: gapX = 30;
  $: gapY = 40;
  $: titleSpace = 25;

  $: colWidth = Math.max(0, (innerWidth - gapX * (cols - 1)) / cols);
  $: rowHeight = Math.max(0, (innerHeight - gapY * (rows - 1)) / rows);

  // --- Generadores D3 Reactivos ---
  $: stackGenerator = stack<WorkerData, Region>()
    .keys(regions)
    .value((d, key) => (showSpain || key !== "España" ? d.regiones[key] : 0))
    .offset(percentMode ? stackOffsetExpand : stackOffsetNone);

  $: globalMax = max(cleanData, (d) =>
      Object.entries(d.regiones)
        .filter(([k]) => showSpain || k !== "España")
        .reduce((a, [, v]) => a + v, 0)
    ) ?? 0;

  $: xGrid = scaleBand()
    .domain(cleanData.map((d) => d.Año.toString()))
    .range([0, colWidth])
    .padding(0.2);

  $: getYScale = () => {
      const range = [rowHeight - titleSpace, 0];
      return percentMode 
        ? scaleLinear().domain([0, 1]).range(range)
        : scaleLinear().domain([0, globalMax]).range(range).nice();
    };

  let hoveredRegionColor: string | null = null;
  let tooltip = { visible: false, x: 0, y: 0, content: "" };

  const formatEuropean = (v: number) => 
    Math.round(v / 1000).toLocaleString("de-DE");

  function handleMouseOver(event: MouseEvent | TouchEvent, key: string, d: any) {
    const val = d.data.regiones[key as Region];
    hoveredRegionColor = regionColors[key as Region];

    // Detectar posición (soporta Touch para móvil)
    const clientX = 'touches' in event ? event.touches[0].pageX : event.pageX;
    const clientY = 'touches' in event ? event.touches[0].pageY : event.pageY;

    tooltip = {
      visible: true,
      x: clientX + 10,
      y: clientY - 20,
      content: `
        <div class="tooltip-year">${d.data.Año}</div>
        <div class="tooltip-row">
          <span class="dot" style="background-color: ${regionColors[key as Region]}"></span>
          <span class="label">${key}:</span>
          <span class="value">${formatEuropean(val)}</span>
        </div>
      `,
    };
  }

  function handleMouseMove(event: MouseEvent) {
    tooltip.x = event.pageX + 10;
    tooltip.y = event.pageY - 20;
  }

  function handleMouseOut() {
    hoveredRegionColor = null;
    tooltip.visible = false;
  }

  $: getOpacity = (key: string) => {
    if (!hoveredRegionColor) return 1;
    return regionColors[key as Region] === hoveredRegionColor ? 1 : 0.3;
  };
</script>

<div class="controls">
  <button on:click={() => (showSpain = !showSpain)}>
    {showSpain ? "Ocultar España" : "Mostrar España"}
  </button>

  <button on:click={() => (percentMode = !percentMode)}>
    {percentMode ? "Ver valores absolutos" : "Ver porcentajes"}
  </button>
</div>

<div class="chart-container" bind:clientWidth={containerWidth}>
  <svg width={containerWidth} {height}>
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {#each tipos as tipo, i}
        {@const row = Math.floor(i / cols)}
        {@const col = i % cols}

        {@const translateX = col * (colWidth + gapX)}
        {@const translateY = row * (rowHeight + gapY)}

        {@const yGrid = getYScale()}
        {@const cellData = dataByTipo.get(tipo)!}
        {@const seriesStack = stackGenerator(cellData)}

        <g class="cell" transform={`translate(${translateX}, ${translateY})`}>
          <foreignObject x="0" y="-38" width="250" height="40">
            <div
              class="tick-label"
            >
              {tipo}
            </div>
          </foreignObject>

          {#each seriesStack as layer}
            <g class="layer" fill={regionColors[layer.key]}>
              {#each layer as d}
                {@const y0 = yGrid(d[0])}
                {@const y1 = yGrid(d[1])}

                <rect
                  x={xGrid(d.data.Año.toString())}
                  width={xGrid.bandwidth()}
                  y={Math.min(y0, y1)}
                  height={Math.abs(y0 - y1)}
                  style="transition:y 0.7s ease,height 0.7s ease,opacity 0.2s ease; opacity:{getOpacity(layer.key)}"
                  on:mouseover={(e) => handleMouseOver(e, layer.key, d)}
                  on:touchstart|passive={(e) => handleMouseOver(e, layer.key, d)}
                  on:mousemove={handleMouseMove}
                  on:mouseout={handleMouseOut}
                  on:touchend={handleMouseOut}
                />
              {/each}
            </g>
          {/each}

          <!-- X axis -->

          <g
            class="x-axis"
            transform={`translate(0, ${rowHeight - titleSpace})`}
          >
            {#each xGrid.domain() as tick}
              <g
                transform={`translate(${xGrid(tick)! + xGrid.bandwidth() / 2},0)`}
              >
                <text y="15" text-anchor="middle" font-size="10px">
                  {tick}
                </text>
              </g>
            {/each}
          </g>

          <!-- Y axis -->

          <g class="y-axis">
            {#if percentMode}
              {#each [0, 0.5, 1] as tick}
                <g transform={`translate(0,${yGrid(tick)})`}>
                  <line x1="-6" x2="0" stroke="currentColor" />
                  <text x="-9" dy="0.32em" text-anchor="end" font-size="10px">
                    {Math.round(tick * 100)}%
                  </text>
                </g>
              {/each}
            {:else}
              {#each yGrid.ticks(3) as tick}
                <g transform={`translate(0,${yGrid(tick)})`}>
                  <line x1="-6" x2="0" stroke="currentColor" />
                  <text x="-9" dy="0.32em" text-anchor="end" font-size="10px">
                    {formatEuropean(tick)}
                  </text>
                </g>
              {/each}
            {/if}
          </g>
        </g>
      {/each}
    </g>
  </svg>
</div>

{#if tooltip.visible}
  <div class="chart-tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px;">
    {@html tooltip.content}
  </div>
{/if}

<style>
  .controls {
    margin-bottom: 10px;
  }

  .chart-container {
    width: 100%;
    position: relative;
  }

  rect {
    cursor: pointer;
  }

  .chart-tooltip {
    position: absolute;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 12px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 1000;
  }

  .x-axis text,
  .y-axis text {
    font-family: sans-serif;
  }
  .y-axis line {
    stroke: #ccc;
  }

  .chart-tooltip {
    position: absolute;
    padding: 8px 12px;
    background: white; /* Fondo blanco como el beeswarm */
    color: #333;
    border: 1px solid #ddd;
    font-size: 13px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    z-index: 1000;
    min-width: 140px;
    font-family: sans-serif;
  }

  :global(.tooltip-year) {
    font-weight: bold;
    margin-bottom: 5px;
    border-bottom: 1px solid #eee;
    padding-bottom: 3px;
    color: #000;
  }

  :global(.tooltip-row) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  :global(.dot) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  :global(.label) {
    color: #666;
    flex-grow: 1;
  }

  :global(.value) {
    font-weight: bold;
  }
</style>
