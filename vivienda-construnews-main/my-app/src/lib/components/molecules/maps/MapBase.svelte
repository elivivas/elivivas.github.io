<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { Protocol } from 'pmtiles';
  import { THEMES } from '$lib/components/molecules/maps/themes';
  import { generateStyleFromTheme } from '$lib/styles/maps/styleFactory';

  export let themeName: keyof typeof THEMES = 'GLOBE_3D_GREEN'; 
  
  // Exportem la instància per si el pare vol afegir markers manualment
  export let mapInstance: maplibregl.Map | undefined = undefined;

  let mapContainer: HTMLDivElement;
  const dispatch = createEventDispatcher();

  onMount(() => {
    if (!maplibregl.config.REGISTERED_PROTOCOLS['pmtiles']) {
        let protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);
    }

    const theme = THEMES[themeName];
    const style = generateStyleFromTheme(theme);

    const isMobile = window.innerWidth <= 768;
    const attribution = isMobile ? false : true;

    mapInstance = new maplibregl.Map({
      container: mapContainer,
      style: style,
      center: theme.center,
      zoom: isMobile ? 4.5 : 5.7,
      minZoom: theme.minZoom || 0,
      maxZoom: theme.maxZoom || 20,
      pitch: theme.features.showTerrain ? -80 : 0,
      maxPitch: theme.maxPitch,
      attributionControl: attribution as any,
    });

    mapInstance.addControl( new maplibregl.ScaleControl(),
        'bottom-left'
    );

    mapInstance.on('load', () => {
        if (theme.projection === 'globe') {
            mapInstance?.setProjection({ type: 'globe' });
        }
        dispatch('load', { map: mapInstance });
    });
    
    mapInstance.on('move', () => dispatch('move'));
  });

  onDestroy(() => {
    mapInstance?.remove();
  });
</script>

<div bind:this={mapContainer} class="map">
    <slot /> 
</div>

<style>
    .map {
        width: 100%;
        height: 100%; 
        min-height: 400px; 
    }
    :global(.maplibregl-ctrl-scale) {
      background-color: transparent !important;
      border: none !important;
      border-bottom: 2px solid #444 !important;

      color: #444 !important;
      font-family: 'IBM Plex Sans', sans-serif !important;
    }
    
</style>

