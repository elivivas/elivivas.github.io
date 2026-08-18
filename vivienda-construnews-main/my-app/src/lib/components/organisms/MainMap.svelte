<script lang="ts">
  import MapLayout from "$lib/components/organisms/MapLayout.svelte";
  import LocatorMap from "$lib/components/molecules/maps/LocatorMap.svelte";
  import MapBase from "$lib/components/molecules/maps/MapBase.svelte";
  import ColorRamp from "$lib/components/molecules/legends/ColorRamp.svelte";
  import MapLayer from "$lib/components/utils/MapLayer.svelte";
  
  let mapInstance: any = $state();

  let hoveredFeature: any = $state(null);
  let mousePos = $state({ x: 0, y: 0 });
  const years = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  let chartWidth = $state(240);

  $effect(() => {
    if (!mapInstance) return;

    const handleInteraction = (e: any) => {
        if (e.features && e.features.length > 0) {
            mapInstance.getCanvas().style.cursor = 'pointer';
            hoveredFeature = e.features[0].properties;
            mousePos = { 
                x: e.originalEvent.pageX, 
                y: e.originalEvent.pageY 
            };
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth > 768) {
            hoveredFeature = null;
            mapInstance.getCanvas().style.cursor = '';
        }
    };

    const handleMapClick = (e: any) => {
        if (window.innerWidth <= 768) {
            const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['cnae_empresas'] });
            if (features.length === 0) {
                hoveredFeature = null;
            }
        }
    };

    mapInstance.on('mousemove', 'cnae_empresas', handleInteraction);
    mapInstance.on('click', 'cnae_empresas', handleInteraction);
    mapInstance.on('mouseleave', 'cnae_empresas', handleMouseLeave);
    mapInstance.on('click', handleMapClick);

    return () => {
      mapInstance.off('mousemove', 'cnae_empresas', handleInteraction);
      mapInstance.off('click', 'cnae_empresas', handleInteraction);
      mapInstance.off('mouseleave', 'cnae_empresas', handleMouseLeave);
      mapInstance.off('click', handleMapClick);
    };
  });
</script>

<MapLayout>
    <MapBase themeName="SPAIN_CLEAN" bind:mapInstance={mapInstance}>
        {#if mapInstance}
            <LocatorMap mainMap={mapInstance} />

            <MapLayer 
                map={mapInstance}
                id="cnae_empresas"
                sourceType="vector"
                type="fill"
                beforeId="roads"
                url="pmtiles://https://data.365-charts.com/cnae_empresas_construccion.pmtiles"
                sourceLayer="cnae_empresas" 
                paint={{
                    'fill-color': [
                        'step',
                        ['to-number', ['get', '2025'], 0],
                        '#F5F5F7',
                        10, '#F1B392',
                        50, '#ED6F2A',
                        100, '#1D1D1F'
                    ],
                    'fill-opacity': 0.8,
                    "fill-outline-color":"#F5F5F7"
                    
                }}
            />

            <MapLayer 
                map={mapInstance}
                id="mun_line"
                sourceType="vector"
                type="line"
                url="pmtiles://https://data.365-charts.com/cnae_empresas_construccion.pmtiles"
                sourceLayer="cnae_empresas" 
                paint={{
                    "line-color": "#666666",
                    "line-width":0.1,
                    "line-opacity":0.2  
                }}
            />

            <!--<MapLayer 
                map={mapInstance}
                id="cnae_empresas"
                sourceType="vector"
                type="circle"
                beforeId="roads"
                url="pmtiles://https://pub-7b24a5bc70bc42f09897afe09746e0e7.r2.dev/data/cnae_empresas_centroides.pmtiles"
                sourceLayer="cnae_empresas" 
                paint={{
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['to-number', ['get', '2025'], 0], 
                        0, 0,           // 0 empreses: invisible
                        5, 2,           // (Abans 2) Pobles molt petits
                        50, 4,          // (Abans 4) Pobles mitjans
                        100, 6,        // (Abans 6) Pobles grans
                        500, 10,        // (Abans 10) Ciutats petites
                        1000, 30,       
                    ],
                    'circle-color': '#ED6F2A',
                    'circle-opacity': 0.3,
                    'circle-stroke-width': 0.2,
                    'circle-stroke-color':'#ED6F2A'
                }}
            />-->
        {/if}
    </MapBase>

    {#snippet description()}
     <ColorRamp
              title="" 
              minLabel="0"
              maxLabel="+100"
              colors={['#F5F5F7', '#F1B392', '#ED6F2A', '#1D1D1F']}
              height = "10px"
            ></ColorRamp>    
    {/snippet}
</MapLayout>
{#if hoveredFeature}
  {@const values = years.map(y => Number(hoveredFeature[y]) || 0)}
  
  {@const maxVal = Math.max(...values, 1)}
  {@const minVal = 0} 
  {@const range = maxVal - minVal}
  
  {@const width = chartWidth > 0 ? chartWidth : 240}
  {@const height = 50}
  {@const padding = 6}
  {@const chartH = height - (padding * 2)}
  
  {@const points = values.map((val, i) => {
    const x = (i / (years.length - 1)) * width;
    const y = padding + chartH - ((val - minVal) / range) * chartH;
    return `${x},${y}`;
  }).join(' ')}

  {@const lastY = padding + chartH - ((values[values.length - 1] - minVal) / range) * chartH}
  {@const midX = width / 2}

  <div 
    class="map-tooltip" 
    style="left: {mousePos.x + 15}px; top: {mousePos.y + 15}px;"
  >
    <h4 class="tooltip-title">{hoveredFeature.NAMEUNIT || hoveredFeature.Municipios || hoveredFeature.MUN_CODE || 'Municipio'}</h4>
    <p class="tooltip-subtitle">Empresas (2012 - 2025)</p>

    <div class="tooltip-chart" bind:clientWidth={chartWidth}>
      <svg {width} {height} style="overflow: visible;">
        <line x1="0" y1={padding + chartH} x2={width} y2={padding + chartH} stroke="var(--color-gray-dark, #ccc)" stroke-width="1" />
        <line x1={midX} y1="0" x2={midX} y2={height} stroke="var(--color-gray-dark, #ccc)" stroke-width="1" stroke-dasharray="2" opacity="0.5" />

        <polyline 
          fill="none" 
          stroke="var(--color-orange-corp, #ED6F2A)" 
          stroke-width="2.5" 
          stroke-linecap="round"
          stroke-linejoin="round"
          {points} 
        />
        
        <circle cx={width} cy={lastY} r="3.5" fill="var(--color-orange-corp, #ED6F2A)" />
      </svg>
    </div>

    <div class="tooltip-ticks">
      <div class="tick">
        <span class="tick-year">2012</span>
        <span class="tick-val">{values[0]}</span>
      </div>
      <div class="tick center">
        <span class="tick-year">2018</span>
        <span class="tick-val">{values[6]}</span>
      </div>
      <div class="tick right">
        <span class="tick-year">2025</span>
        <span class="tick-val highlight">{values[values.length - 1]}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .map-tooltip {
    position: absolute;
    background-color: var(--color-white, #ffffff);
    z-index: 1000;
    pointer-events: none; 
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 260px;
    font-family: var(--font-secondary, 'IBM Plex Sans', sans-serif);
    transition: transform 0.1s ease-out;
  }

  .tooltip-title {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--color-black-text, #1D1D1F);
    margin: 0 0 0.25rem 0;
  }

  .tooltip-subtitle {
    font-size: 0.75rem;
    color: var(--color-gray-dark, #666);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tooltip-chart {
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: center;
  }

  .tooltip-ticks {
    display: flex;
    justify-content: space-between;
  }

  .tick {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
  }

  .tick.center { align-items: center; }
  .tick.right { align-items: flex-end; }

  .tick-year {
    color: var(--color-gray-dark, #888);
    font-size: 0.65rem;
    margin-bottom: 2px;
  }

  .tick-val {
    color: var(--color-black-text, #333);
    font-weight: 600;
  }

  .tick-val.highlight {
    color: var(--color-orange-corp, #ED6F2A);
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .map-tooltip {
      position: fixed !important; 
      top: auto !important;
      left: 0 !important;
      bottom: 0 !important;
      width: 100vw;
      border-radius: 16px 16px 0 0; 
      padding: 1.5rem 1.5rem 2rem 1.5rem; 
      box-sizing: border-box;
      pointer-events: auto;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .tooltip-chart svg {
      width: 100%; /* El SVG escala al ancho del móvil */
    }
  }
</style>