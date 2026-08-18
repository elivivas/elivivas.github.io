<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { line, area, curveMonotoneX } from 'd3-shape';
  import { onMount } from 'svelte';

  interface DataPoint {
    year: number;
    popChange: number | null;
    houses: number | null;
  }

  const data: DataPoint[] = [
      { year: 2014, houses: 35,  popChange: 85.8 },
      { year: 2015, houses: 41,  popChange: 43.1 },
      { year: 2016, houses: 37,  popChange: 59.9 },
      { year: 2017, houses: 49,  popChange: 66.7 },
      { year: 2018, houses: 58,  popChange: 63.1 },
      { year: 2019, houses: 71,  popChange: 89.8 },
      { year: 2020, houses: 77,  popChange: 129.1 },
      { year: 2021, houses: 84,  popChange: null }, 
      { year: 2022, houses: 79.9,  popChange: null },
      { year: 2023, houses: 80,  popChange: null },
      { year: 2024, houses: 86,  popChange: null }
  ];

  let container: HTMLElement;
  let scrollY = 0;
  let windowHeight = 0;
  let width = 0;
  let height = 0;

  onMount(() => {
    windowHeight = window.innerHeight;
    let currentWidth = window.innerWidth;

    height = currentWidth > 768 ? windowHeight * 0.65 : windowHeight * 0.60;

    const handleResize = () => {
      if (window.innerWidth !== currentWidth) {
        windowHeight = window.innerHeight;
        currentWidth = window.innerWidth;
        height = currentWidth > 768 ? windowHeight * 0.65 : windowHeight * 0.60;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  $: progress = 0;
  $: if (container && windowHeight && scrollY !== undefined) {
    const rect = container.getBoundingClientRect();
    const totalScrollable = rect.height - windowHeight;
    progress = Math.max(0, Math.min(1, -rect.top / totalScrollable));
  }

  $: currentYear = 2014 + (progress * 10);

  function interpolate(year: number, key: 'popChange' | 'houses'): number | null {
    const nextIndex = data.findIndex(d => d.year > year);
    if (nextIndex === -1) return data[data.length - 1][key];
    const prev = data[nextIndex - 1];
    const next = data[nextIndex];
    if (prev[key] === null) return null;
    if (next[key] === null) return prev[key]; 
    const ratio = (year - prev.year) / (next.year - prev.year);
    return (prev[key] as number) + ((next[key] as number) - (prev[key] as number)) * ratio;
  }

  $: visibleData = [
    ...data.filter(d => d.year <= Math.floor(currentYear)),
    { 
      year: currentYear, 
      popChange: currentYear > 2020 ? null : interpolate(currentYear, 'popChange'),
      houses: interpolate(currentYear, 'houses') 
    }
  ];

  const margin = { top: 60, right: 20, bottom: 40, left: 40 };
  $: w = Math.max(0, width - margin.left - margin.right);
  $: h = Math.max(0, height - margin.top - margin.bottom);

  $: xScale = scaleLinear().domain([2014, 2024]).range([0, w]);
  $: yScale = scaleLinear().domain([0, 150]).range([h, 0]);

  $: lineGeneratorPop = line<DataPoint>()
    .defined(d => d.popChange !== null)
    .x(d => xScale(d.year))
    .y(d => yScale(d.popChange as number))
    .curve(curveMonotoneX);
  
  $: areaGeneratorPop = area<DataPoint>()
    .defined(d => d.popChange !== null)
    .x(d => xScale(d.year))
    .y0(h) 
    .y1(d => yScale(d.popChange as number)) 
    .curve(curveMonotoneX);

  $: areaGeneratorHouses = area<DataPoint>()
    .defined(d => d.houses !== null)
    .x(d => xScale(d.year))
    .y0(h) 
    .y1(d => yScale(d.houses as number)) 
    .curve(curveMonotoneX);

  $: lineGeneratorHouses = line<DataPoint>()
    .defined(d => d.houses !== null)
    .x(d => xScale(d.year))
    .y(d => yScale(d.houses as number))
    .curve(curveMonotoneX);

  $: pathPop = lineGeneratorPop(visibleData) ?? "";
  $: pathAreaPop = areaGeneratorPop(visibleData) ?? "";
  $: pathAreaHouses = areaGeneratorHouses(visibleData) ?? "";
  $: pathLineHouses = lineGeneratorHouses(visibleData) ?? "";

  //TOOLTIPS :)
  let mouseX = 0;
  let mouseY = 0;
  let showTooltip = false;

  $: tooltipData = {
    year: Math.floor(currentYear),
    pop: interpolate(currentYear, 'popChange'),
    houses: interpolate(currentYear, 'houses')
  };

  let hasInteracted = false; 

  function handleInteraction(e: MouseEvent | TouchEvent) {
    if (e instanceof MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    } else {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      hasInteracted = true; 
    }
    showTooltip = true;
  }

  function handleMouseLeave() {
    if (width > 768) showTooltip = false;
  }
</script>

<svelte:window bind:scrollY />
<div class="scrolly-container" bind:this={container}>
  <div class="chart-sticky" bind:clientWidth={width}>
    {#if width > 0 && height > 0}
      <svg {width} {height}>
        <g transform="translate(0, -15)">
          <text x="0" y="-25" text-anchor="start" class="title-txt">
            {#if width > 768}
              Más demanda que oferta
            {:else}
              Más demanda que oferta
            {/if}
          </text>
          <text x="0" y="5" text-anchor="start" class="subtitle">
            {#if width > 768}
              Hogares | viviendas construidas, 2014-2024. En miles
            {:else}
              Hogares | viviendas construidas, 2014-2024
            {/if}
          </text>
        </g>
        <g transform="translate({margin.left}, {margin.top})">
          
          {#each yScale.ticks(6) as tick}
            <line x1="0" y1={yScale(tick)} x2={w} y2={yScale(tick)} stroke="#eee" />
            <text x="-10" y={yScale(tick)} dy="1" text-anchor="end" class="tick-label">{tick}</text>
          {/each}

          {#each xScale.ticks(4) as tick}
            <text x={xScale(tick)} y={yScale(0) +20} dy="1" text-anchor="middle" class="tick-label">{tick}</text>
          {/each}

          <line x1={xScale(currentYear)} y1="0" x2={xScale(currentYear)} y2={h} stroke="#ccc" stroke-dasharray="3" />
          <text x={xScale(currentYear)} y="-20" text-anchor="middle" class="current-year-txt">
            {Math.floor(currentYear)}
          </text>
          
          <path d={pathPop} fill="none" stroke="#003443" stroke-width="4"/>
          <path d={pathLineHouses} fill="none" stroke="#ef6c00" stroke-width="4" />

          {#if visibleData.length > 0}
            {@const last = visibleData[visibleData.length - 1]}
            
            {#if currentYear <= 2020}
              {#if last.popChange !== null}
                <circle cx={xScale(last.year)} cy={yScale(last.popChange)} r="5" fill="#003443" />
              {/if}
            {:else}
              <circle cx={xScale(2020)} cy={yScale(129.1)} r="5" fill="#003443" />
            {/if}

            {#if currentYear >= 2020 && currentYear <= 2022}
              <g 
                style="transition: opacity 0.4s; opacity: {currentYear > 2016 ? 1 : 0}"
                transform="translate({xScale(2020) - 160}, {width > 768 ? yScale(123) - 110 : yScale(120) - 110})"
              >
                <circle cx="160" cy="87" r="40" fill="#333" fill-opacity=.1 stroke="#333" stroke-dasharray="4 2" stroke-opacity="0.3" />
                
                <text fill="#333" font-size="14px">
                  <tspan x="0" dy="0" font-weight="bold">2020: La brecha se duplica</tspan>
                  <tspan x="0" dy="1.4em">Se crearon 129 mil hogares,</tspan>
                  <tspan x="0" dy="1.4em">casi el doble que casas terminadas.</tspan>
                </text>

                <path d="M 120, 45 Q 150, 60 160, 90" stroke="#333" fill="none" />
              </g>
            {/if}
            {#if last.houses !== null}
              <circle cx={xScale(last.year)} cy={yScale(last.houses)} r="5" fill="#ef6c00" />
            {/if}
          {/if}
        </g>
        {#if showTooltip || (width <= 768 && progress > 0)}
          {@const last = visibleData[visibleData.length - 1]}
          
          {#if last.popChange !== null}
            <g transform="translate({xScale(last.year) +45}, {yScale(last.popChange) +30})">
              <text
                text-anchor="middle" 
                class="dynamic-label" 
                fill="#003443"
                font-weight="bold"
              >
                {Math.round(last.popChange)}
              </text>
            </g>
          {/if}

          {#if last.houses !== null}
            <g transform="translate({xScale(last.year) +45}, {yScale(last.houses) +30})">
              <text 
                text-anchor="middle" 
                class="dynamic-label" 
                fill="#ef6c00"
                font-weight="bold"
              >
                {Math.round(last.houses)}
              </text>
            </g>
          {/if}
        {/if}

        <rect 
          width={w} 
          height={h} 
          fill="transparent" 
          on:mousemove={handleInteraction}
          on:touchstart|passive={handleInteraction}
          on:mouseleave={handleMouseLeave}
        />
        {#if currentYear >= 2014 && currentYear <= 2017}
          <g class="legend" transform="translate({margin.left},{margin.top})">
              <g class="item-legend">
                <text x={xScale(width > 768 ? 2014.2 : 2014.5)} y={width > 768 ? yScale(84) : yScale(84)} fill="#333" font-size="14px" font-family="sans-serif" alignment-baseline="baseline">
                  Incremento del número de hogares (hasta 2020)
                </text>
              </g>
              <g class="item-legend">
                <text x={xScale(width > 768 ? 2014.2 : 2014.5)} y={width > 768 ? yScale(33): yScale(33.5)} fill="#333" font-size="14px" font-family="sans-serif" alignment-baseline="baseline">
                    Viviendas libres terminadas (sin VPO)
                </text>
              </g>
          </g>
        {/if}
      </svg>
    {/if}
    <div class="notes">
      Fuente vivienda construida: <a href="https://apps.fomento.gob.es/boletinonline2/?nivel=2&orden=32000000">Ministerio de Fomento, suma de VPO y vivienda libre - serie anual.</a> 
      Fuente número de hogares: <a href="https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176952&menu=resultados&idp=1254735572981">INE, incremento interanual del número de hogares. Datos disponibles hasta 2020 - serie anual.</a>
    </div>
  </div>
</div>

<style>
  .scrolly-container { 
    height: 300svh; 
    position: relative; 
  }
  .chart-sticky { 
    position: sticky; 
    top: 20%;
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    height: 65svh; 
    width: 100%;
    margin-top: 17%;
    margin-bottom: 5%;
  }
  .current-year-txt { font-weight: bold; fill: #555; font-size: 20px; }
  svg { overflow: visible; }

  @media (max-width:768px) {
    .chart-sticky { 
      margin-top: 55%;
      margin-bottom: 10%;
      top:25%;
      height: 60svh; 
      width: 100%; 
    }
    .current-year-txt {  
      font-size: 1rem; 
    }
  }
</style>