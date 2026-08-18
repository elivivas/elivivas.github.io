<script lang="ts">
  import { rollups, mean, max } from "d3-array";
  import { scaleLinear, scaleBand } from "d3-scale";
  import { format } from "d3-format";

  export let data: any[] = [];
  
  let width = 0;
  let searchTerm = "";
  const margin = { top: 20, right: 0, bottom: 20, left: 180 };

  $: allProcessed = rollups(
    data.filter(d => d.cif_provider && d.cif_provider !== "Desconocido"),
    v => ({
      estimated: mean(v, d => d.estimatedAmount || 0) as any,
      payable: mean(v, d => d.payableAmount || 0) as any,
      displayName: v[0].name_provider || v[0].cif_provider
    }),
    d => d.cif_provider
  )
  .map(([cif, values]) => ({ cif, ...values }))
  .sort((a, b) => b.payable - a.payable);

  $: filteredData = allProcessed
    .filter(d => 
      d.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.cif.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  $: innerWidth = Math.max(0, width - margin.left - margin.right);
  $: rowHeight = 35;
  $: dynamicHeight = filteredData.length * rowHeight + margin.top + margin.bottom;

  $: xMax = max(allProcessed, d => Math.max(d.estimated, d.payable)) || 0;

  $: xScale = scaleLinear()
    .domain([0, xMax])
    .range([0, innerWidth]);

  $: yScale = scaleBand()
    .domain(filteredData.map(d => d.cif))
    .range([0, filteredData.length * rowHeight])
    .padding(0.3);

  $: ticks = xScale.ticks(width / 100);

  const fmt = format(",.0f");
  const fmtEje = format("~s");
</script>

<div bind:clientWidth={width}>
  <div class="header-actions">
    <div class="legend">
      <span class="dot estimated"></span> Estimado 
      <span class="dot payable"></span> Pagado
      <span class="count">Mostrando {filteredData.length} de {allProcessed.length}</span>
    </div>
    <div class="search-container">
      <input 
        type="text" 
        bind:value={searchTerm} 
        placeholder="Buscar proveedor o CIF..."
        class="search-input"
      />
      {#if searchTerm}
        <button class="clear-btn" on:click={() => searchTerm = ""}>✕</button>
      {/if}
    </div>
  </div>

  {#if width > 0}
    <svg {width} height={dynamicHeight}>
      <g transform="translate({margin.left}, {margin.top})">
        
        <g class="axis-x">
          {#each ticks as tick}
            <g transform="translate({xScale(tick)}, 0)">
              <line y1="-5" y2={filteredData.length * rowHeight} stroke="#eee" />
              <text y="-12" text-anchor="middle" class="tick-label">{fmtEje(tick)}€</text>
            </g>
          {/each}
        </g>

        {#each filteredData as d (d.cif)}
          <g transform="translate(0, {yScale(d.cif)})" class="bar-group">
            <title>
              {d.displayName}
              Pagado: {fmt(d.payable)}€
              Estimado: {fmt(d.estimated)}€
            </title>

            <text 
              x="-10" 
              y={yScale.bandwidth() / 2} 
              text-anchor="end" 
              dominant-baseline="middle"
              class="label"
            >
              {d.displayName.length > 25 ? d.displayName.slice(0, 25) + '...' : d.displayName}
            </text>

            <rect
              width={xScale(d.estimated)}
              height={yScale.bandwidth()}
              fill="#666"
              fill-opacity="0.15"
              rx="1"
            />

            <rect
              y={yScale.bandwidth() * 0.2}
              width={xScale(d.payable)}
              height={yScale.bandwidth() * 0.6}
              fill="#ef6c00"
              rx="1"
            />
          </g>
        {/each}
      </g>
    </svg>
  {/if}
</div>

<style>
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding: 8px 12px;
    padding-right: 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 250px;
    font-size: 0.9rem;
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
  }

  .legend {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 10px;
  }

  .count {
    margin-left: 20px;
    font-style: italic;
    color: #999;
  }

  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 1px;
    margin-left: 10px;
  }
  .estimated { background: #e0e0e0; }
  .payable { background: #ef6c00; }

  .label {
    font-size: 11px;
    fill: #555;
    text-transform: capitalize;
  }

  .tick-label {
    font-size: 10px;
    fill: #aaa;
  }

  .bar-group:hover rect:first-of-type {
    fill-opacity: .3;
  }

  svg {
    display: block;
    overflow: visible;
    transition: height 0.3s ease;
  }
</style>