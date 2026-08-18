<script lang="ts">
  import LegendItem from "../atoms/items/LegendItem.svelte";
  import { max } from "d3-array";
  import { scaleBand, scaleSqrt } from "d3-scale";
  import { formatLocale } from "d3-format";
  import { randomUniform } from "d3-random";
  import { 
    forceSimulation, 
    forceX, 
    forceY, 
    forceCollide 
  } from "d3-force";
  import { onMount } from "svelte"; 
  export let data: any[] = [];

  interface TenderRow {
    City: string;
    Status: number;
    link: string;
    payableAmount: number;
    duration: number;
    title: string;
    year: number;
    nameProvider: string;
  }

  interface BeeNode extends TenderRow {
    x: number;
    y: number;
    radius: number;
  }

  interface TooltipState {
    x: number;
    y: number;
    node: BeeNode;
  }

  const cities = [
    "Barcelona",
    "Valladolid",
    "Mérida",
    "Madrid",
    "Palma",
    "Valencia",
    "Tenerife",
  ];

  const colors: Record<number, string> = {
    8: "#ED6F2A",
    9: "#BD622F",
    3: "#003443",
    4: "#5c7d87",
    5: "#BDCACD",
  };

  const labels: Record<number, string> = {
    8: "Adjudicada",
    9: "Formalizada",
    3: "Desierta",
    4: "Abandonada",
    5: "Revocada",
  };
  const blueStatuses = [3, 4, 5];
  const orangeStatuses = [8, 9];

  let rootEl: HTMLDivElement;
  let plotWidth = 0;
  let rawRows: TenderRow[] = [];
  let nodes: BeeNode[] = [];
  let tooltip: TooltipState | null = null;
  let tooltipEl: HTMLDivElement | null = null;
  let dataReady = false;
  let activeStatuses = new Set<number>();
  let metricMode: "duration" | "payment" = "duration";

  const esLocale = formatLocale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", " €"],
    minus: "-",
    percent: "%"
  });

  const formatNumber = esLocale.format(",.2f");
  const formatMoney = esLocale.format("~s");

  const margin = { top: 10, right: 0, bottom: 0, left: 0 };

  $: isMobile = plotWidth < 768;
  $: chartHeight = plotWidth < 768 ? 400 : 460;
  $: innerWidth = Math.max(0, plotWidth - margin.left - margin.right);
  $: innerHeight = Math.max(0, chartHeight - margin.top - margin.bottom);
  $: maxAmount = max(rawRows, (d) => d.payableAmount) ?? 0;
  $: maxDuration = sizeLegendStepsDuration[2];
  const sizeLegendStepsPayment = [5_000_000, 15_000_000, 25_000_000];
  const sizeLegendStepsDuration = [365, 1820, 3640];
  $: sizeLegendSteps =
    metricMode === "duration" ? sizeLegendStepsDuration : sizeLegendStepsPayment;
  $: sizeLegendMax = metricMode === "duration" ? maxDuration : maxAmount;

  $: xScale = scaleBand<string>()
    .domain(cities)
    .range([margin.left, margin.left + innerWidth]);
  $: visibleNodes =
    activeStatuses.size > 0
      ? nodes.filter((node) => activeStatuses.has(node.Status))
      : nodes;

  function parseRow(d: Record<string, unknown>): TenderRow | null {
    const city = String(d.City ?? d.city ?? "").trim();
    const status = Number(d.Status ?? d.status);
    const link = d.link_href as any;
    const payableAmount = Number(d.payableAmount ?? 0);
    const duration = Number(d.duration ?? 0);
    const title = String(d.title ?? "").trim();
    const year = Number(d.year ?? 0);
    const nameProvider = String(d.name_provider ?? "").trim();

    if (!cities.includes(city)) return null;
    if (!Number.isFinite(payableAmount) || payableAmount < 0) return null;
    if (colors[status] === undefined) return null;

    return {
      City: city,
      Status: status,
      payableAmount,
      duration,
      title,
      year,
      nameProvider,
      link
    };
  }

  function runLayout() {
    if (!rawRows.length || innerWidth <= 0 || innerHeight <= 0) return;
    const metricAccessor =
      metricMode === "duration"
        ? (d: TenderRow) => d.duration
        : (d: TenderRow) => d.payableAmount;
    const durationMobileRange: [number, number] = [2, 8];
    const durationDesktopRange: [number, number] = [4, 12];
    const paymentMobileRange: [number, number] = [2, 12];
    const paymentDesktopRange: [number, number] = [3, 18];

    let radiusRange: [number, number];
    if (metricMode === "duration") {
      radiusRange = plotWidth < 768 ? durationMobileRange : durationDesktopRange;
    } else {
      radiusRange = plotWidth < 768 ? paymentMobileRange : paymentDesktopRange;
    }
    const localMaxMetric = max(rawRows, metricAccessor) ?? 0;

    const radius = scaleSqrt()
      .domain([0, localMaxMetric || 0])
      .range(radiusRange);

    const nextNodes: BeeNode[] = rawRows.map((d) => ({
      ...d,
      x: (xScale(d.City) ?? margin.left) + xScale.bandwidth() / 2,
      y: randomUniform(margin.top + 20, margin.top + innerHeight * 0.62)(),
      radius: radius(metricAccessor(d)),
    }));

    const sim = forceSimulation<BeeNode>(nextNodes)
      .force(
        "x",
        forceX<BeeNode>(
            (d) => (xScale(d.City) ?? margin.left) + xScale.bandwidth() / 2,
          )
          .strength(isMobile ? 9 : 0.65),
      )
      .force(
        "y",
        forceY(margin.top + innerHeight * 0.5)
          .strength(isMobile ? 0.1 : 0.02),
      )
      .force(
        "collide",
        forceCollide<BeeNode>((d) => d.radius + 0.3),
      )
      .stop();

    for (let i = 0; i < (isMobile ? 520 : 420); i += 1) sim.tick();

    nodes = nextNodes.map((node) => ({
      ...node,
      x: Math.max(
        margin.left + node.radius,
        Math.min(margin.left + innerWidth - node.radius, node.x),
      ),
      y: Math.max(
        margin.top + node.radius,
        Math.min(margin.top + innerHeight - node.radius, node.y),
      ) ,
    }));
  }

  function showTooltipAt(node: BeeNode, clientX: number, clientY: number) {
    const bounds = rootEl.getBoundingClientRect();
    const tooltipWidth = tooltipEl?.offsetWidth ?? 220;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 160;
    const gap = 12;
    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, bounds.width - tooltipWidth - 8);
    const maxY = Math.max(minY, bounds.height - tooltipHeight - 8);
    const pointerX = clientX - bounds.left;
    const pointerY = clientY - bounds.top;
    const rightX = pointerX + gap;
    const leftX = pointerX - tooltipWidth - gap;
    const centeredY = pointerY - tooltipHeight / 2;
    const belowY = pointerY + gap;
    const aboveY = pointerY - tooltipHeight - gap;

    let rawX = rightX;
    if (rightX > maxX && leftX >= minX) rawX = leftX;
    else if (rightX > maxX) rawX = maxX;

    let rawY = centeredY;
    if (rawY < minY) rawY = belowY <= maxY ? belowY : minY;
    else if (rawY > maxY) rawY = aboveY >= minY ? aboveY : maxY;

    tooltip = {
      x: Math.max(minX, Math.min(maxX, rawX)),
      y: Math.max(minY, Math.min(maxY, rawY)),
      node,
    };
  }

  function showPointerTooltip(node: BeeNode, event: MouseEvent | PointerEvent) {
    showTooltipAt(node, event.clientX, event.clientY);
  }

  function showFocusTooltip(node: BeeNode, event: FocusEvent) {
    const target = event.currentTarget as HTMLElement;
    const bounds = target.getBoundingClientRect();
    showTooltipAt(
      node,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
  }

  function clearTooltip() {
    tooltip = null;
  }

  function handleRootPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".bee-dot")) {
      clearTooltip();
    }
  }

  function toggleStatus(statusCode: number) {
    const next = new Set(activeStatuses);
    if (next.has(statusCode)) next.delete(statusCode);
    else next.add(statusCode);
    activeStatuses = next;
    tooltip = null;
  }

  function toggleMetricMode() {
    metricMode = metricMode === "duration" ? "payment" : "duration";
  }

  $: if (data.length > 0 && plotWidth > 0 && metricMode) {
    const freshRows = data
      .map((row) => parseRow(row))
      .filter((row): row is TenderRow => row !== null);
    
    rawRows = freshRows;
    dataReady = true;
    import('svelte').then(({ tick }) => {
        tick().then(runLayout);
    });
  }

  onMount(() => {
    if (data.length > 0) dataReady = true;
  });

  function openLink(node: BeeNode) {
    window.open(node.link, "_blank");
  }

  function handleNodeClick(node: BeeNode) {
    if (!isMobile) {
      openLink(node);
    }
  }

  function handleNodeDoubleClick(node: BeeNode) {
    if (isMobile) {
      openLink(node);
    }
  }
</script>

<section class="beeswarm">
    <div class="legend-row">
      {#each blueStatuses as statusCode}
        <button
          class="legend-filter"
          class:is-inactive={activeStatuses.size > 0 &&
            !activeStatuses.has(statusCode)}
          on:click={() => toggleStatus(statusCode)}
          aria-pressed={activeStatuses.has(statusCode)}
        >
          <LegendItem
            type="circle"
            color={colors[statusCode]}
            label={labels[statusCode]}
            size="lg"
          />
        </button>
      {/each}
      {#each orangeStatuses as statusCode}
        <button
          class="legend-filter"
          class:is-inactive={activeStatuses.size > 0 &&
            !activeStatuses.has(statusCode)}
          on:click={() => toggleStatus(statusCode)}
          aria-pressed={activeStatuses.has(statusCode)}
        >
          <LegendItem
            type="circle"
            color={colors[statusCode]}
            label={labels[statusCode]}
            size="lg"
          />
        </button>
      {/each}
    </div>
    {#if sizeLegendMax > 0}
      <div class="second-legend">
        <div class="metric-toggle" role="tablist" aria-label="Métrica">
            <button
              class="metric-option"
              class:is-active={metricMode === "duration"}
              on:click={() => (metricMode = "duration")}
              role="tab"
              aria-selected={metricMode === "duration"}
            >
              Duración del contrato
            </button>
            <button
              class="metric-option"
              class:is-active={metricMode === "payment"}
              on:click={() => (metricMode = "payment")}
              role="tab"
              aria-selected={metricMode === "payment"}
            >
              Pagado sin IVA
            </button>
        </div>
        <div>
          <div class="size-items">
            {#each sizeLegendSteps as value}
              <div class="size-item">
                <span
                  class="size-dot"
                  style={
                    `width:${Math.max(8, (Math.sqrt(Math.min(value, sizeLegendMax)) / Math.sqrt(sizeLegendMax || 1)) * 22)}px;
                    height:${Math.max(8, (Math.sqrt(Math.min(value, sizeLegendMax)) / Math.sqrt(sizeLegendMax || 1)) * 22)}px;`}
                ></span>
                <span>
                  {#if metricMode === "duration"}
                    {Math.round(value / 365)} años
                  {:else}
                    {formatMoney(value)}
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>
      {/if}



  <div
    class="chart-root"
    role="presentation"
    bind:this={rootEl}
    bind:clientWidth={plotWidth}
    on:pointerdown={handleRootPointerDown}
  >
    {#if nodes.length}
      <div class="axis-row">
        {#each cities as city}
          <span
            class="axis-label"
            style={`left:${(xScale(city) ?? 0) + xScale.bandwidth() / 2}px;`}
          >
            {city}
          </span>
        {/each}
      </div>
      <svg 
        width={plotWidth} 
        height={chartHeight}
        style="position: absolute; top: 0px; left: 0; pointer-events: none;" 
      >
        <g class="axis">
          {#each cities as city}
            <line
              x1={(xScale(city) ?? 0) + xScale.bandwidth() / 2}
              y1={30}
              x2={(xScale(city) ?? 0) + xScale.bandwidth() / 2}
              y2={chartHeight}
              stroke="#e0e0e0" 
              stroke-dasharray="4"
              stroke-width="1"
            />
          {/each}
        </g>
      </svg>
      <div class="plot-area" style={`height:${chartHeight}px;`}>
        {#each visibleNodes as node}
          <button
            class="bee-dot"
            style={`left:${node.x}px;top:${node.y}px;width:${node.radius * 2}px;height:${node.radius * 2}px;background:${colors[node.Status]};border-color:${colors[node.Status]};`}
            on:mouseenter={(event) => showPointerTooltip(node, event)}
            on:mousemove={(event) => showPointerTooltip(node, event)}
            on:focus={(event) => showFocusTooltip(node, event)}
            on:pointerdown={(event) => showPointerTooltip(node, event)}
            on:mouseleave={clearTooltip}
            on:click={() => handleNodeClick(node)}
            on:dblclick={() => handleNodeDoubleClick(node)}
            aria-label={`${node.City}: ${labels[node.Status] ?? "Desconocido"}, ${formatMoney(node.payableAmount)} euros`}
          ></button>
        {/each}
      </div>
    {/if}

    {#if tooltip}
      <div
        class="map-tooltip"
        bind:this={tooltipEl}
        style={`left:${tooltip.x}px;top:${tooltip.y}px;`}
      >
        <div class="tooltip-title">{tooltip.node.City}</div>
           <div class="tooltip-line">
          Proveedor: {tooltip.node.nameProvider || "N/D"}
        </div>
        <div class="tooltip-line">
          Año: {labels[tooltip.node.year] ?? tooltip.node.year}
        </div>
        <div class="tooltip-line">
          Importe: {formatNumber(tooltip.node.payableAmount)} €
        </div>
            <div class="tooltip-line">
          Duración: {tooltip.node.duration >= 365 ? (Math.round(tooltip.node.duration / 365) + " años") : (Math.round(tooltip.node.duration / 30)+ " meses")}
        </div>   
        <div class="tooltip-line">{tooltip.node.title.length > 300 ? tooltip.node.title.slice(0,300) + "..." : tooltip.node.title || "Sin título"}</div>
      </div>
    {/if}
  </div>
</section>

<style>
  .beeswarm {
    margin-top: 0.3rem;
  }

  .size-items {
    margin-top: 0.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.8rem;
  }

  .size-item {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #444;
    font-size: 0.9rem;
  }

  .size-dot {
    display: inline-block;
    border-radius: 999px;
    border: 0;
    background: rgba(0, 0, 0, 0.22);
    flex: 0 0 auto;
  }
  .chart-root {
    margin-top: 1rem;
    position: relative;
  }

  .axis-row {
    position: relative;
  }

  .axis-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 1rem;
    line-height: 1.2;
    text-align: center;
    color: #3a3a3a;
  }

  .plot-area {
    position: relative;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .bee-dot {
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid transparent;
    opacity: 0.84;
    cursor: pointer;
    padding: 0;
  }

  .bee-dot:hover,
  .bee-dot:focus-visible {
    opacity: 1;
    outline: none;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.85),
      0 0 0 4px rgba(38, 38, 38, 0.2);
  }

  @media (max-width: 768px) {
    .chart-root {
      margin-top: 1rem;
      position: relative;
    }

    .axis-row {
      transform: translateX(-4%) translateY(30%);
    }

    .axis-label {
      font-size: 0.8rem;
      transform: rotate(-45deg) translateY(40%);
    }

    .plot-area {
      position: relative;
      overflow: hidden;
      margin-top: 1.5rem;
    }
  }
</style>
