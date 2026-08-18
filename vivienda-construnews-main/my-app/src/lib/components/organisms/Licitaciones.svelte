<script lang="ts">
  import { onMount } from "svelte";
  import { min, max } from "d3-array";
  export let data: any[] = [];
  /*Propuesta y lluvia de ideas para la estructura, que librerías usar y cómo: 
   Se trata de tener una primera escena inicial con 1000 rects (cada rect es una 
   licitacion), acupa todo el ancho de la pantalla (svg: width 100%). Al principio no hay ningun gap entre ellos, 
   (color solido naranja), ponemos una anottation en el centro una vez el usuario ve toda la pantalla naranja.
   Texto primera anotacion: "En España, se licita muy poca vivienda pública. Solo se resuelve un 4,6% de las licitaciones"

  
   Seguimos haciendo escroll y el texto desaparece (es un active and inactive, poderiamos decir, nada de cards en un scrolly container)
   El div donde va el texto centrado. Se hace scroll y se deja de mostrar el texto. Los rects se exapnden dejando el gap correspondiente
   con border radius ligero para cada rect. Hacemos scroll y aparece en el centro: "Cada cuadrado es una licitacion para construir 
   VPO resuelta". Quizás seria buena idea crear un objecto con todos los textos a mostrar ordenados con un id o numero del paso. 
   Vamos a colorear cada recuadro segun una categoria especifica de los datos: campo "status", si está formalizada o awarded: naranja, si 
   esta "void" negro, si está renounced (gris). Lo suyo seria tener los datos ordenados per se en un sortedData, de modo que 
   estemos simulando un Treemap. Convertimos todos los rects en un stacked bar segun el porcentaje de 
   voids, awarded, renuncias, etc. De momento queda centrada en el centro de la pantalla. Hacemos scroll, aparece el texto: 
   Texto: "X de cada 10 licitaciones quedaron desiertas".  Justo cuando aparece el texto desplazamos el stacked bar al position 
   fixed o absolute top:10px. Estan todos los rects, con lo cual, solo tenemos que selecionarlos paso a paso. 
   Scroll y entramos con la logica de convertir el grid treemap
   en un historiograma, debe ser animado, calculamos la posicion x y y en base al campo "year", el height de cada 
   rect en el historiograma debe dimensionarse por el "payableAmount". Width calculado segun el numero de columnas que tengamos. 
   cada columna es un año. La transicion debe ser secuencial, es decir, se va produciendo en base al scroll que hace el usuario.
   Como un contador. Una vez acabado, remove the axis, agrupamos los rects según en que ciudad se construye, grafico de barras horizontal
   según el tipo de organo licitador (municipal, autonomico, estatal, otros). Volvemos a reformular y ahora hacemos el grafico de barras
   segun la ciudad ordenado de mayor a menor cantidad de licitaciones. Luego ordenamos con la misma estructura por average_paid_amount.
   Vemos que valladoliz baja de posicion. Hay que poner axis en todos, ponemos siempre axis x de mean. Organizamos otra vez. 
   De momento lo dejamos aquí, porque aun faltan 5 gráficos más. 

   1. Load data
   Primero de todo, necesitamos saber que columnas debe tener este dataset. Carrgarlo desde la carpeta datos. Definir los 
   typos con typscript. 
  
  */ 
  interface Licitacion {
    id: string;
    title: string;
    status: number;
    year: number;
    payableAmount: number;
    estimatedAmount: number;
    city: String;
    organo: number;
    // Coordenadas para cada escena
    x: number;
    y: number;
    w: number;
    h: number;
  };

  let width = 0;
  let height = 0;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let container: HTMLElement;
  let size = 25;
  let scale = .7;
  let minYear: number;
  let maxYear: number;
  let totalColumns: number;
  let wCol: number;
  let maxMoney: number;
  let chartOriginX = 0;
  let chartOriginY = 0;

  let scrollY = 0;
  let innerHeight = 0;
  let progress = 0;

  let puntos: Licitacion[] = [];
  const VIRTUAL_SIZE = 600;

  let steps = [
    {id: 0,
      text: "La vivienda pública en España es la excepción, no la regla: en los últimos 11 años solo se han resuelto 1.212 licitaciones"
    },
    {id: 1,
      text: "El mosaico de la vivienda pública"
    },
    {id: 2,
      text: "¿Cúanto dinero se ha invertido en vivienda social en los últimos años?"
    }
  ]
  const categorias = [
    { label: "Formalizada", color: "#BD622F" },
    { label: "Adjudicada", color: "#ED6F2A" },
    { label: "Revocada", color: "#BDCACD" }, 
    { label: "Abandonada", color: "#5c7d87" },
    { label: "Desierta", color: "#003443" },
  ];
  const spacing = 20;
  const maxDisplayWidth = 500;

  const countByYear = puntos.reduce((acc, p) => {
      acc[p.year] = (acc[p.year] || 0) +1;
      return acc
    }, {} as Record<number, number>);
  const validYears = Object.keys(countByYear)
    .map(Number)
    .filter(year => year !== 0);

  $: if (container && innerHeight && scrollY !== undefined) {
    const rect = container.getBoundingClientRect();
    const distance = -rect.top;
    const totalRecorrido = rect.height -innerHeight;
    progress = Math.max(0, Math.min(1, distance /totalRecorrido));
  }

  function draw() {
    if (!ctx || !canvas || puntos.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    scale = Math.min(width, height) / VIRTUAL_SIZE;
    if (width > 768 && (VIRTUAL_SIZE * scale) > maxDisplayWidth) {
      scale = maxDisplayWidth / VIRTUAL_SIZE;
    }
    const offsetX = (width - VIRTUAL_SIZE * scale) / 2;
    const offsetY = (height - VIRTUAL_SIZE * scale) / 2;
  
    chartOriginX = offsetX + (50 * scale);
    chartOriginY = offsetY - (50 * scale);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(50, -50);

    // Lógica de Gap y Radio
    const sizeMultiplier = progress > 0.1 ? 0.85 : 1.1;
    const radius = progress > 0.1 ? 0.5 : 0;

    const overlapPadding = sizeMultiplier === 1.1 ? 0.5 : 0;
    const currentStackHeight: Record<number, number> = {};

    puntos.forEach((p, i) => {
      //Pintamos los rects
      if (progress > 0.3) {
        if (p.status === 9) ctx!.fillStyle = "#BD622F";
        if (p.status === 8) ctx!.fillStyle = "#ED6F2A"; 
        if (p.status === 5) ctx!.fillStyle = "#BDCACD";
        if (p.status === 4) ctx!.fillStyle = "#5c7d87";
        if (p.status === 3) ctx!.fillStyle = "#003443"; 
      } else {
        ctx!.fillStyle = "#ED6F2A"; 
      }
      //Calculamos posiciones para la stacked bar
      const t = Math.max(0, Math.min(1, (progress - 0.4) / 0.2)); //scroll primera animacion

      const anchoBarra = 500;
      const anchoPuntoBarra = anchoBarra / puntos.length;
      const barraX = i * anchoPuntoBarra;
      const barraY = -150;

      const currentX = p.x * (1 - t) + barraX * t;
      const currentY = p.y * (1 - t) + barraY * t;

      const targetW = anchoPuntoBarra;
      const targetH = 40;
      
      const currentW = (p.w * sizeMultiplier + overlapPadding) * (1 - t) + targetW * t;
      const currentH = (p.h * sizeMultiplier + overlapPadding) * (1 - t) + targetH * t;

      const colIndex = p.year - minYear;
      const histoX = colIndex * (wCol + 5); 

      const maxHistoHeight = 500; 
      const rectHeight = (p.payableAmount / maxMoney) * maxHistoHeight;

      const yBase = currentStackHeight[p.year] || 0;
      const histoY = 600 - yBase - rectHeight;

      currentStackHeight[p.year] = yBase + rectHeight;
      const t2 = Math.max(0, Math.min(1, (progress - 0.65) / 0.20)); // scroll 2a animación
      const finalX = currentX * (1 - t2) + histoX * t2;
      const finalY = currentY * (1 - t2) + histoY * t2;
      const finalW = currentW * (1 - t2) + wCol * t2;
      const finalH = currentH * (1 - t2) + rectHeight * t2;

      if (radius > 0 && t < 0.9) {
        ctx!.beginPath();
        // @ts-ignore
        ctx!.roundRect(finalX, finalY, finalW, finalH, radius * (1 - t));
        ctx!.fill();
      } else {
        ctx!.fillRect(finalX, finalY, finalW, finalH);
      }
    });

    ctx.restore();
  }

  $: if(ctx && (progress !== undefined || width || height || puntos.length)) {
    draw();
  }

  $: if (data && data.length > 0) {
    const total = data.length;
    const columns = 28;
    const gridWidth = 500; 
    const size = gridWidth / columns;

    puntos = data.map((d, i): Licitacion => {
      return {
        id: d.id || `item-${i}`,
        title: d.title || "",
        status: Number(d.status),
        year: Number(d.year) || 0,
        payableAmount: d.payableAmount !== null ? Number(d.payableAmount) : 0,
        estimatedAmount: Number(d.estimatedAmount) || 0,
        city: d.city || d.CityName || "Desconocida",
        organo: d.organo || "",
        x: (i % columns) * size,
        y: Math.floor(i / columns) * size,
        w: size,
        h: size
      };
    });

    const countByYear = puntos.reduce((acc, p) => {
      acc[p.year] = (acc[p.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const validYearsArr = Object.keys(countByYear).map(Number).filter(year => year !== 0);
    
    minYear = Math.min(...validYearsArr);
    maxYear = Math.max(...validYearsArr);
    totalColumns = (maxYear - minYear) + 1;
    wCol = (maxDisplayWidth / totalColumns) - 2;

    const moneyByYear = puntos.reduce((acc, p) => {
      acc[p.year] = (acc[p.year] || 0) + p.payableAmount;
      return acc;
    }, {} as Record<number, number>);

    maxMoney = Math.max(...Object.values(moneyByYear));
  }

  onMount(() => {
    ctx = canvas.getContext("2d");

    innerHeight = window.innerHeight;
    height = window.innerHeight;

    let currentWidth = window.innerWidth;

    const handleResize = () => {
      if (window.innerWidth !== currentWidth) {
        innerHeight = window.innerHeight;
        height = window.innerHeight;
        currentWidth = window.innerWidth;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };


  });
</script>

<svelte:window bind:scrollY/>

<div class="scrolly-container" bind:this={container}>
  <div class="canvas-container" bind:clientWidth={width}>
    <svg class="annotations-layer" {width} {height}>
      {#if progress > .1 && progress < .3}
        <g class="annotation" style="opacity: {progress > 0.15 ? 1 : 0}">
          <path
            d="M {width/2 - 80} {height/2 - 310} 
              Q {width/2 - 120} {height/2 - 250} 
              {width/2 - 50} {height/2 - 210}"
            stroke="black" 
            fill="none" 
            marker-end="url(#arrowhead)"
          />
          <text
            x={width/2 -150} 
            y={height/2 -320}
            fill="black"
            font-size="14px"
          >
            Cada cuadradito es una licitación
          </text>
        </g>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
        </defs>
      {/if}
      
      {#if progress > 0.3 && progress < 0.4}
        <g 
          transform="translate({chartOriginX}, {chartOriginY - 160 * scale})"
          class="annotation" 
          style="opacity: {progress > 0.3 ? 1 : 0}"
        >
          {#each categorias as cat, i}
            <g transform="translate(0, {i * spacing})">
              <rect width={size/2} height={size/2} rx="1.2" fill={cat.color} />
              <text 
                x={size/2 + 10} 
                y={width < 768 ? size/3 : size/2.3} 
                fill="black" 
                font-size="14px" 
                alignment-baseline="middle"
              >
                {cat.label}
              </text>
            </g>
          {/each}
        </g>
        <g transform="translate({chartOriginX + (300 * scale)}, {chartOriginY + (840 * scale)})">
          <text
            x={-300 * scale} 
            y={3 * scale}
            fill="black"
            font-size="14px"
          >
            2 de cada 10 licitaciones quedaron desiertas
          </text>
        </g>
      {/if}

      {#if progress > .4 && progress < .65}
        <text
          x={chartOriginX + (30 * scale)} 
          y={chartOriginY - (122 * scale)}
          fill="white"
          font-size="16px"
          font-weight="700"
          text-anchor="middle"
        >
          81%
        </text>

        <text
          x={chartOriginX + (470 * scale)} 
          y={chartOriginY - (122 * scale)}
          fill="white"
          font-size="16px"
          font-weight="700"
          text-anchor="middle"
        >
          19%
        </text>
      {/if}
      {#if progress > .65 && progress < .9}
          <g class="axis x-axis" style="opacity: {(progress - 0.70) * 10}">
            {#each Array.from({length: totalColumns}) as _, i}
                {@const year = minYear + i}
                <text
                  x={chartOriginX + (i * (wCol + 5) * scale) + (wCol * scale / 2)} 
                  y={chartOriginY + (620 * scale)} 
                  text-anchor="middle"
                  font-size="{10 * Math.max(1, scale)}px"
                >
                  {year}
                </text>
            {/each}
          </g>
          <g class="axis y-axis" style="opacity: {(progress - 0.70) * 10}">
            {#each [0.25, 0.5, 0.75, 1] as pct}
              {@const valorMillones = (maxMoney * pct) / 1_000_000}
              {@const yPos = (chartOriginY + (600 * scale)) - (pct * 500 * scale)} 
              
              <line 
                x1={chartOriginX}
                y1={yPos} 
                x2={chartOriginX + (maxDisplayWidth * scale)} 
                y2={yPos} 
                stroke="#eee" 
                stroke-width=".4"
              />
              <text
                x={chartOriginX + (20 *scale)} 
                y={yPos}
                text-anchor="end"
                alignment-baseline="middle"
                font-size="{12 * Math.max(1, scale)}px"
                fill="#999"
              >
                {Math.round(valorMillones)}M €
              </text>
            {/each}
          </g>
          <g 
            class="annotation" 
            style="opacity: {progress > 0.8 ? 1 : 0}"
            transform="translate({chartOriginX + (50 * scale)}, {chartOriginY + (-10 * scale)})"
          >
            <text fill="black" font-size="16px">
              <tspan x="0" dy="0">En 2021 se invirtió</tspan>
              <tspan x="0" dy="1.4em">más de 343M de euros</tspan>
              <tspan x="0" dy="1.4em">en vivienda de protección oficial</tspan>
            </text>
            <path
              d="M 50 50 
                Q 50 150
                150 140"
              stroke="black" 
              fill="none" 
              marker-end="url(#arrowhead)"
            />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="black" />
              </marker>
            </defs>
          </g>
      {/if}
    </svg>

    <div class="overlay" style="opacity:{progress < .1 ? 1 : 0};transform: translate(-50%, -{50 + progress * 50}%)">
      <p>{steps[0].text}</p>
    </div>
    <div class="overlay" style="opacity:{progress > .9 && progress <= 1 ? 1 : 0};transform: translate(-50%, -{50 + progress * 50}%)">
      <p style="color:black">{steps[1].text}</p>
    </div>
    
    <canvas 
      bind:this={canvas}
      style="width: {width}px; height: {height}px; opacity: {progress > 0.9 ? Math.max(0, 1 - (progress - 0.9) / 0.05) : 1};"
    ></canvas>
  </div>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100vh;
    position: sticky;
    top:0
  }
  .scrolly-container {
    height: 600vh;
  }

  canvas {
    display: block;
  }

  .overlay {   
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    pointer-events: none;
    text-align: center;
    transition: opacity 0.5s ease;
  }

  .overlay p {
    font-size: 1.2rem;
    color: white;
    line-height: 1.4;
    font-weight: 600;
    max-width: 350px;
    font-family: var(--font-secondary);
  }


  .annotations-layer {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5; 
    pointer-events: none;
  }

  .annotation {
    transition: opacity 0.5s ease;
  }

@media (max-width: 768px) {
  .overlay p {
      font-size: 1.1rem;
      margin: 0 auto;
  }
  .overlay {   
    width: 100%;
    padding: 4rem;
  }
}
</style>

