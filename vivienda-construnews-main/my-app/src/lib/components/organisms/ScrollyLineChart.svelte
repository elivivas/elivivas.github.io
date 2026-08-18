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
      { year: 1991, houses: 227,  popChange: 46 },
      { year: 1992, houses: 178,  popChange: 43 },
      { year: 1993, houses: 170,  popChange: 53 },
      { year: 1994, houses: 174,  popChange: 55 },
      { year: 1995, houses: 155,  popChange: 65 },
      { year: 1996, houses: 194,  popChange: 81 },
      { year: 1997, houses: 224,  popChange: 75 },
      { year: 1998, houses: 226,  popChange: 72 }, 
      { year: 1999, houses: 296,  popChange: 60 },
      { year: 2000, houses: 362,  popChange: 53 },
      { year: 2001, houses: 452,  popChange: 53 },
      { year: 2002, houses: 480,  popChange: 38 },
      { year: 2003, houses: 462,  popChange: 45 },
      { year: 2004, houses: 509,  popChange: 55 },
      { year: 2005, houses: 528,  popChange: 60 },
      { year: 2006, houses: 597,  popChange: 58 },
      { year: 2007, houses: 579,  popChange: 62 },
      { year: 2008, houses: 563.631,  popChange: 63 },
      { year: 2009, houses: 356,  popChange: 58 },
      { year: 2010, houses: 218,  popChange: 50 },
      { year: 2011, houses: 121,  popChange: 50 },
      { year: 2012, houses: 80,  popChange: 46 },
      { year: 2013, houses: 43,  popChange: 15 },
      { year: 2014, houses: 35,  popChange: 10 },
      { year: 2015, houses: 41,  popChange: 4 },
      { year: 2016, houses: 37,  popChange: 3 },
      { year: 2017, houses: 49,  popChange: 2 },
      { year: 2018, houses: 58,  popChange: 2 },
      { year: 2019, houses: 71,  popChange: 4 },
      { year: 2020, houses: 77,  popChange: 0.785 },
      { year: 2021, houses: 84,  popChange: 0.876 }, 
      { year: 2022, houses: 79.9,  popChange: 1.68 },
      { year: 2023, houses: 80,  popChange: 0.981 },
      { year: 2024, houses: 86,  popChange: 1.134 }
  ];

  let container: HTMLElement;
  let scrollY = 0;
  let windowHeight = 0;
  let width = 0;
  let height = 0;

  onMount(() => {
    windowHeight = window.innerHeight;
    let currentWidth = window.innerWidth;
    
    height = windowHeight * 0.75;

    const handleResize = () => {
      if (window.innerWidth !== currentWidth) {
        windowHeight = window.innerHeight;
        currentWidth = window.innerWidth;
        height = windowHeight * 0.75;
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
  $: totalYears = 2024 - 1991;

  $: currentYear = 1991 + (progress * totalYears);

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
      popChange: interpolate(currentYear, 'popChange'),
      houses: interpolate(currentYear, 'houses') 
    }
  ];

  const margin = { top: 60, right: 10, bottom: 40, left: 45 };
  $: w = Math.max(0, width - margin.left - margin.right);
  $: h = Math.max(0, height - margin.top - margin.bottom);

  $: xScale = scaleLinear().domain([1991, 2024]).range([0, w]);
  $: yScale = scaleLinear().domain([0, 600]).range([h, 0]);

  $: lineGeneratorPop = line<DataPoint>()
    .defined(d => d.popChange !== null)
    .x(d => xScale(d.year))
    .y(d => yScale(d.popChange as number))
    .curve(curveMonotoneX);

  $: areaGeneratorHouses = area<DataPoint>()
    .defined(d => d.houses !== null)
    .x(d => xScale(d.year))
    .y0(h) 
    .y1(d => yScale(d.houses as number)) 
    .curve(curveMonotoneX);
  $: areaGeneratorPop = area<DataPoint>()
    .defined(d => d.popChange !== null)
    .x(d => xScale(d.year))
    .y0(h) 
    .y1(d => yScale(d.popChange as number)) 
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
              El desplome del ladrillo 
            {:else}
              El desplome del ladrillo
            {/if}
          </text>
          <text x="0" y="5" text-anchor="start" class="subtitle">
            {#if width > 768}
              Evolución de la vivienda construida, 1991-2024. En miles
            {:else}
              Vivienda construida, 1991-2024. En miles
            {/if}
          </text>
        </g>


        <g transform="translate({margin.left}, {margin.top})">
          
          {#each yScale.ticks(6) as tick}
            <line x1="0" y1={yScale(tick)} x2={w} y2={yScale(tick)} stroke="#eee" />
            <text x="-10" y={yScale(tick)} dy="1" text-anchor="end" class="tick-label">{tick}</text>
          {/each}

          {#each xScale.ticks(6) as tick}
            <text x={xScale(tick)} y={yScale(0) +20} dy="1" text-anchor="center" class="tick-label">{tick}</text>
          {/each}


          <line x1={xScale(currentYear)} y1="0" x2={xScale(currentYear)} y2={h} stroke="#ccc" stroke-dasharray="3" />
          <text x={xScale(currentYear)} y="-25" text-anchor="middle" class="current-year-txt">
            {Math.floor(currentYear)}
          </text>
          
          <path d={pathAreaHouses} fill="#ef6c00" fill-opacity="0.15" />
          <path d={pathAreaPop} fill="#003443" fill-opacity="0.25" />
          
          <path d={pathPop} fill="none" stroke="#003443" stroke-width="4" />
          <path d={pathLineHouses} fill="none" stroke="#ef6c00" stroke-width="4" />

          {#if visibleData.length > 0}
            {@const last = visibleData[visibleData.length - 1]}
            
            {#if last.popChange !== null}
                <circle cx={xScale(last.year)} cy={yScale(last.popChange)} r="5" fill="#003443" />
            {/if}

            {#if currentYear > 2008 && currentYear <= 2017}
              <g 
                style="transition: opacity 0.5s; opacity: {currentYear > 2008 ? 1 : 0}"
                transform="translate({width > 768 ? xScale(2008) - 150 : xScale(2008) - 160}, {width > 768 ? yScale(550) - 90 : yScale(550) - 110})"
              >
                {#if width < 768}
                  <text fill="#333" font-size="14px" y={yScale(550)} x={xScale(1991)}>
                    <tspan x="0" dy="0" font-weight="bold">2008: Crisis financiera</tspan>
                    <tspan x="0" dy="1.4em">Cada día se terminaban</tspan>
                    <tspan x="0" dy="1.4em">1545 casas, un ritmo</tspan>
                    <tspan x="0" dy="1.4em">seis veces superior</tspan>
                    <tspan x="0" dy="1.4em">al actual</tspan>
                  </text>
                  <circle cx="155" cy="100" r="30" fill="#333" fill-opacity=.1 stroke="#333" stroke-dasharray="4 2" stroke-opacity="0.3" />
                {:else}
                  <circle cx="155" cy="100" r="30" fill="#333" fill-opacity=.1 stroke="#333" stroke-dasharray="4 2" stroke-opacity="0.3" />
                  <text fill="#333" font-size="14px" y={yScale(580)}>
                    <tspan x="0" dy="0" font-weight="bold">2008: Crisis financiera</tspan>
                    <tspan x="0" dy="1.4em">Cada día se terminaban</tspan>
                    <tspan x="0" dy="1.4em">1545 casas,</tspan>
                    <tspan x="0" dy="1.4em">un ritmo</tspan>
                    <tspan x="0" dy="1.4em">seis veces</tspan>
                    <tspan x="0" dy="1.4em">superior</tspan>
                    <tspan x="0" dy="1.4em">al actual</tspan>
                  </text>
                {/if}
              </g>
            {/if}

            {#if currentYear >= 2017 && currentYear <= 2020}
              <g 
                class="annotation" 
                style="transition: opacity 0.5s; opacity: {currentYear > 2017 ? 1 : 0}"
                transform="translate({xScale(2016) - 100}, {yScale(40) - 100})"
              >
                <rect x="-10" y="-20" width="200" height="65" fill="white" fill-opacity=".8" rx="4" />

                <text fill="#333" font-size="14px">
                  <tspan x="0" dy="0" font-weight="bold">2017: Progresiva recuperación</tspan>
                  <tspan x="0" dy="1.4em">La construcción de vivienda</tspan>
                  <tspan x="0" dy="1.4em">libre se empieza a recuperar</tspan>
                </text>

                <path
                  d="M 80, 50 Q 90, 80 100, 90" 
                  stroke="#333" 
                  fill="none" 
                  marker-end="url(#arrowhead)"
                />
                
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                  </marker>
                </defs>
              </g>
            {/if}

            {#if currentYear >= 2020 && currentYear <= 2022}
              <g 
                class="annotation" 
                style="transition: opacity 0.5s; opacity: {currentYear > 2020.2 ? 1 : 0}"
                transform="translate({width < 768 ? xScale(2014) - 70 : xScale(2020) - 50}, {yScale(300) - 100})"
              >
                <rect x="-10" y="-20" width="200" height="100" fill="white" fill-opacity=".9" rx="4" />
                <text fill="#333" font-size="14px" text-anchor="center">
                  <tspan x="0" dy="0" font-weight="bold">2020: Pandemia Covid-19</tspan>
                  <tspan x="0" dy="1.4em">La construcción de VPO cae</tspan>
                  <tspan x="0" dy="1.4em">a su mínimo histórico con</tspan>
                  <tspan x="0" dy="1.4em">785 viviendas terminadas</tspan>
                </text>
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
              <g transform="translate({xScale(last.year) +45}, {yScale(last.popChange) +50})">
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
              <g transform="translate({xScale(last.year) +45}, {yScale(last.houses) +50})">
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
        {#if currentYear >= 1991 && currentYear <= 1998}
         <g class="legend" transform="translate({margin.left},{margin.top})">
            <g class="item-legend">
               <rect x={width > 768 ? xScale(1992): xScale(1992.5)} y={width > 768 ? yScale(232) : yScale(240)} width="200" height="20" fill="white" fill-opacity=".7" rx="2" />
               <text x={width > 768 ? xScale(1992): xScale(1992.5)} y={width > 768 ? yScale(223) : yScale(223)} fill="#333" font-size="14px" font-family="sans-serif" alignment-baseline="baseline">
                Vivienda libre construida
              </text>
            </g>
            <g class="item-legend">
              <rect x={width > 768 ? xScale(1992): xScale(1992.5)} y={width > 768 ? yScale(52) : yScale(60)} width="200" height="20" fill="white" fill-opacity=".7" rx="2" />
              <text x={width > 768 ? xScale(1992): xScale(1992.5)} y={width > 768 ? yScale(42) : yScale(42)} fill="#333" font-size="14px" font-family="sans-serif" alignment-baseline="baseline">
                  Vivienda de protección oficial construida
              </text>
            </g>
        </g>
      {/if}
      </svg>
    {/if}
    <div class="notes">
      Fuente vivienda libre: <a href="https://apps.fomento.gob.es/boletinonline2/?nivel=2&orden=32000000">Ministerio de Fomento, total de viviendas libres terminadas - serie anual.</a> 
      Fuente VPO: <a href="https://apps.fomento.gob.es/boletinonline2/?nivel=2&orden=31000000">Ministerio de Fomento, número de calificaciones definitivas. Régimen general y concertado - serie anual.</a>
    </div>
  </div>
</div>

<style>
  .scrolly-container { 
    height: 300dvh; 
    position: relative; 
  }
  .chart-sticky { 
    position: sticky; 
    top: 15%;
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    height: 75svh; 
    width: 100%;
    margin-top: 15%;
    margin-bottom: 5%;
  }
  .current-year-txt { font-weight: bold; fill: #555; font-size: 20px; }
  svg { overflow: visible; }

  

  @media (max-width:768px) {
    .chart-sticky { 
      margin-top: 40%;
      margin-bottom: 10%;
      top:15%;
      height: 75svh; 
      width: 100%; 
    }
    .current-year-txt {  
      font-size: 1rem; 
    }
  }
</style>