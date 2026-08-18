export interface MapTheme {
    id: string;
    bounds?: [[number, number], [number, number]];
    center: [number, number];
    zoom: number;
    mobileZoom: number;
    minZoom ?: number;
    maxZoom ?: number;
    maxPitch?: number;
    projection: 'globe' | 'mercator';
    colors: {
        background: string;
        water: string;
        land ?: string,
        boundariesADM0 ?: string,
        boundariesWidthLine ?: number,
        boundariesADM1 ?: string,
        boundariesWidthLine1 ?: number,
        textureOpacity ?: number;
        roads: string;
        roadsLineWidth ?: number;
        roadsOpacity ?: number;
        buildings: string;
        text: string;
    };
    text: {
        textField: string;
        textFont: string;
        textSize: number;
        textAnchor: string;
    }
    features: {
        showTerrain: boolean;
        showRoads: boolean;
        showStreetNames:boolean;
        showBuildings: boolean; 
        showBuildings3D: boolean;
        showCountriesNames: boolean;
        showBoundariesADM0 ?: boolean;
        showBoundariesADM1 ?: boolean;
        showBoundariesADM2 ?: boolean;
        showBoundariesADM3 ?: boolean;
        filterCountry?: string;
        filterIso?: string;
        texture ?: string; // nom del fitxer pmtiles
    };
}

export const THEMES: Record<string, MapTheme> = {
    'GLOBE_3D_WHITE': {
        id: 'globe-3d-white',
        center: [0, 20],
        zoom:1,
        mobileZoom: 1,
        minZoom: 0,
        maxPitch: 80,
        projection: 'globe',
        colors: {
            background: '#ffffffff',
            water: '#ffffffff',
            boundariesADM0: '#a46347',
            boundariesWidthLine: .6, 
            textureOpacity: 0.6,
            roads: '#a09f9fff',
            roadsLineWidth: 2,
            roadsOpacity: 1,
            buildings: '#9b9b9bff',
            text: '#000000ff'
        },
            text: {
            textField: 'name:es',
            textFont: 'IBM-Plex-Sans',
            textSize: 12,
            textAnchor: 'center'
        },
        features: {
            showTerrain: true,
            showRoads: false,
            showStreetNames:false,
            showBuildings: true,
            showBuildings3D: false,
            showCountriesNames: true,
            showBoundariesADM0: true,
            texture:'world_dem_clipped.pmtiles', // nom del fitxer pmtiles
        }
    },
    'SPAIN_CLEAN': {
        id: 'spain-clean',
        center: [-3, 40],
        zoom: 6,
        mobileZoom: 4,
        minZoom: 4,
        projection: 'mercator',
        colors: {
            background: 'rgb(255, 255, 255)',
            water: '#ffffffff',//'#c5c4c4ff',
            land: 'rgb(255, 254, 254)',
            boundariesADM0: '#a4634709',
            boundariesWidthLine: 1, 
            roads: '#f2f2f3',
            roadsLineWidth: 1,
            roadsOpacity: 1,
            buildings: '#9b9b9bc5',
            text: 'rgba(0, 0, 0, 0)'
        },
            text: {
            textField: 'name:es',
            textFont: 'IBM-Plex-Sans',
            textSize: 12,
            textAnchor: 'center'
        },
        features: {
            showTerrain: true,
            showRoads: true,
            showStreetNames:true,
            showBuildings: true,
            showBuildings3D: false,
            showCountriesNames: false,
            showBoundariesADM0: true,
            filterCountry: 'Spain',
            filterIso: 'es',
            texture:'',
        }
    }
}