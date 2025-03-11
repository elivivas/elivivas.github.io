let width, height, centerX;

function updateDimensions() {
    const container = document.getElementById('chart-container');
    width = container.clientWidth;
    height = container.clientHeight *0.8;
    
    if (window.innerWidth < 768) {  
        width = window.innerWidth;
        height = window.innerHeight * 0.4;
    }
}

function updateCenterX() {
    centerX = width / 2;
}

const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("svg-content-responsive", true);

function updateSVGViewBox() {
    svg.attr("viewBox", `0 0 ${width} ${height}`);
}

const logoGroup = svg.append("g")
    .attr("class", "logo-group")
    .attr("transform", "translate(20,-170)");

logoGroup.append("image")
    .attr("xlink:href", "/image/logo.svg")
    .attr("width", 200) 
    .attr("height", 200);


const g = svg.append("g");
let animationInterval;
let currentLayerIndex = 0;
let animationSpeed = 500; 

let totalLayers, baseCellSize, baseGridSize;

function updateSizes() {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        totalLayers = 10;
        baseCellSize = 10;
        baseGridSize = 10;
    } else {
        totalLayers = 10;  
        baseCellSize = 20;
        baseGridSize = 20;  
    }
}

function showText(text, x, y) {
    g.append("text")
        .attr("class", "layer-text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(text)
        .style("opacity", 0)
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function hideText() {
    g.selectAll(".layer-text").remove();
}

function createGrid3D(gridSize, layerIndex, totalLayers) {
    const totalSize = baseCellSize * gridSize;
    const verticalOffset = layerIndex * (baseCellSize * 4);
    const opacityFactor = 1 - (layerIndex / totalLayers);

    function iso(x, y) {
        return {
            x: (x - y) * Math.cos(Math.PI / 10.5),
            y: (x + y) * Math.sin(Math.PI / 10.5) + verticalOffset
        };
    }

    const gridGroup = g.append("g")
        .attr("class", `grid-layer-${layerIndex} grid-layer`)
        .attr("data-layer", layerIndex);

    for (let x = 0; x <= gridSize; x++) {
        let start = iso(x * baseCellSize, 0);
        let end = iso(x * baseCellSize, totalSize);
        gridGroup.append("line")
            .attr("x1", start.x).attr("y1", start.y)
            .attr("x2", end.x).attr("y2", end.y)
            .attr("stroke", "#a1cad8")
            .attr("stroke-width", 0.3)
            .attr("opacity", opacityFactor);
    }

    for (let y = 0; y <= gridSize; y++) {
        let start = iso(0, y * baseCellSize);
        let end = iso(totalSize, y * baseCellSize);
        gridGroup.append("line")
            .attr("x1", start.x).attr("y1", start.y)
            .attr("x2", end.x).attr("y2", end.y)
            .attr("stroke", "#a1cad8")
            .attr("stroke-width", 0.3)
            .attr("opacity", opacityFactor);
    }

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const topLeft = iso(x * baseCellSize, y * baseCellSize);
            const topRight = iso((x + 1) * baseCellSize, y * baseCellSize);
            const bottomLeft = iso(x * baseCellSize, (y + 1) * baseCellSize);
            const bottomRight = iso((x + 1) * baseCellSize, (y + 1) * baseCellSize);

            gridGroup.append("path")
                .attr("d", `M${topLeft.x},${topLeft.y}L${topRight.x},${topRight.y}L${bottomRight.x},${bottomRight.y}L${bottomLeft.x},${bottomLeft.y}Z`)
                .attr("fill", "white")
                .attr("opacity", 0.35);
        }
    }

    function getLayerText(index) {
        if (index === 0) return "Input: enquestes";
        if (index === 1) return "Idees clau";
        if (index === 2) return "Dades i gràfics";
        if (index === totalLayers - 1) return "Output: recomanacions";
        return "";
    }
    function getLayerLink(index) {
        if (index === 0) return "#introduccio";
        if (index === 1) return "#insights";
        if (index === 2) return "#dades";
        if (index === totalLayers - 1) return "#recomanacions";
        return "";
    }

    gridGroup
    .on("mouseenter", function() {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${centerX}, ${-30})`)
            .style("filter", "brightness(1.3)")
            .call(selection => {
                selection.selectAll("line")
                    .attr("stroke", "#00FFFF"); 
                selection.selectAll("path")
                    .attr("fill", "#00FFFF")
                    .attr("opacity", 0.5); 
            });
        
        d3.selectAll(`.grid-layer-${layerIndex - 1}`)
            .transition()
            .duration(200)
            .attr("transform", (d, i) => `translate(${centerX}, ${(i + 1) * 10})`);

        const layerText = getLayerText(layerIndex);
        if (layerText) {
            showText(layerText, width / 2, height / 2);
        }
    })
    .on("mouseleave", function() {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("transform", `translate(${centerX}, 0)`)
            .style("filter", "none")
            .call(selection => {
                selection.selectAll("line")
                    .attr("stroke", "#a1cad8"); 
                selection.selectAll("path")
                    .attr("fill", "white")
                    .attr("opacity", 0.35);
            });
        
        
        d3.selectAll(`.grid-layer-${layerIndex - 1}`)
            .transition()
            .duration(200)
            .attr("transform", `translate(${centerX}, 0)`);

        hideText();
    })
    .on("click", function(event) {
        event.preventDefault();
        const layerIndex = parseInt(d3.select(this).attr("data-layer"));
        const link = getLayerLink(layerIndex);
        if (link) {
            document.querySelector(link).scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    });
}

function createAllGrids() {
    for (let i = 0; i < totalLayers; i++) {
        const gridSize = 20 - i * 2;
        createGrid3D(gridSize, i, totalLayers);
    }
}

let startTime;

function animateLayers() {
    if (!startTime) {
        startTime = Date.now();
    }

    if (Date.now() - startTime >= 6800) {
        stopAnimation();
        return;
    }

    d3.selectAll(".grid-layer")
        .transition()
        .duration(200)
        .attr("transform", `translate(${centerX}, 0)`)
        .style("filter", "none")
        .style("opacity", function() {
            const layerIndex = d3.select(this).attr("data-layer");
            return 1 - (layerIndex / totalLayers)
        })
        .call(selection => {
            selection.selectAll("line")
                .attr("stroke", "white"); 
            selection.selectAll("path")
                .attr("fill", "white")
                .attr("opacity", 0.4); 
        });

    d3.select(`.grid-layer-${currentLayerIndex}`)
        .transition()
        .duration(200)
        .attr("transform", `translate(${centerX}, -30)`)
        .style("filter", "brightness(1.3)")
        .style("opacity", 1)
        .call(selection => {
            selection.selectAll("line")
                .attr("stroke", "#00FFFF"); 
            selection.selectAll("path")
                .attr("fill", "#00FFFF")
                .attr("opacity", 0.5); 
        });

    currentLayerIndex = (currentLayerIndex + 1) % totalLayers;

    if (animationSpeed > 150) {
        animationSpeed -= 70;
    }

    animationInterval = setTimeout(animateLayers, animationSpeed);
}

function resize() {
    updateDimensions();
    updateCenterX();
    updateSVGViewBox();
    g.selectAll("*").remove();
    createAllGrids();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function stopAnimation() {
    clearTimeout(animationInterval);
}

updateDimensions();
updateCenterX();
updateSizes();
resize();
window.addEventListener('resize', debounce(resize, 250));

startTime = null;
animateLayers();



/////////////////////Grafics barres apilades////////////////////////
// Datos ficticios
const data = [
    {categoria: "A", valor1: 30, valor2: 20},
    {categoria: "B", valor1: 50, valor2: 40},
    {categoria: "C", valor1: 20, valor2: 60},
    {categoria: "D", valor1: 40, valor2: 30},
    {categoria: "E", valor1: 60, valor2: 50}
];

let isBarChart = true;

function getContainerSize(containerId) {
    const container = document.getElementById(containerId);
    return {
        width: container.clientWidth,
        height: container.clientHeight || 300 // Altura mínima de 300px
    };
}

function crearGraficoBarras() {
    const containerId = "chart-container-1";
    const containerSize = getContainerSize(containerId);

    const margin = {top: 40, right: 20, bottom: 40, left: 60};
    const width = containerSize.width - margin.left - margin.right;
    const height = containerSize.height - margin.top - margin.bottom;

    d3.select("#" + containerId).selectAll("svg").remove();

    const svg = d3.select("#" + containerId)
        .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    const y = d3.scaleLinear()
        .range([height, 0]);

    x.domain(data.map(d => d.categoria));
    y.domain([0, d3.max(data, d => Math.max(d.valor1, d.valor2))]);
    
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.categoria))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.valor1))
            .attr("height", d => Math.max(0, height - y(d.valor1)))
            .attr("fill", "#274361")
            .attr("rx", "7")
            .attr("ry", "7");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Gráfico de Barras Vertical");
}

function crearGraficoRadial() {
    const containerId = "chart-container-1";
    const containerSize = getContainerSize(containerId);

    const margin = {top: 40, right: 40, bottom: 40, left: 40};
    const width = containerSize.width - margin.left - margin.right;
    const height = containerSize.height - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    d3.select("#" + containerId).selectAll("svg").remove();

    const svg = d3.select("#" + containerId)
        .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
            .attr("transform", `translate(${containerSize.width/2},${containerSize.height/2})`);

    const x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .domain(data.map(d => d.categoria))
        .paddingInner(0.1);  // Añade espacio entre segmentos

        const total = d3.sum(data, d => d.valor1);
        const dataWithPercentages = data.map(d => ({
            ...d,
            porcentaje: (d.valor1 / total) * 100
        }));
    
        const pie = d3.pie()
            .value(d => d.porcentaje)
            .sort(null);
    
        const arc = d3.arc()
            .innerRadius(radius * 0.2) // Crea un espacio en el centro
            .outerRadius(radius * 0.9) // Reduce ligeramente el radio externo
            .cornerRadius(5); // Aumenta el radio de la esquina para mayor visibilidad

    
        const arcs = svg.selectAll("arc")
            .data(pie(dataWithPercentages))
            .enter()
            .append("g")
            .attr("class", "arc");
            
        arcs.append("path")
            .attr("fill", "#274361")
            .attr("d", arc)
            .attr("stroke", "white")
            .style("stroke-width", "2px");
    
        svg.append("text")
            .attr("x", 0)
            .attr("y", -radius - 20)
            .attr("text-anchor", "middle")
            .text("Gráfico Radial");
}

function toggleChart() {
    isBarChart = !isBarChart;
    const containerId = "chart-container-1";
    
    // Actualizar el gráfico
    if (isBarChart) {
        crearGraficoBarras();
    } else {
        crearGraficoRadial();
    }
    
    // Actualizar el estado del botón
    const toggleButton = document.getElementById('toggle-chart');
    if (toggleButton) {
        toggleButton.setAttribute('data-state', isBarChart ? 'barras' : 'circular');
        
        // Actualizar el texto activo
        const circularOption = toggleButton.querySelector('.circular');
        const barrasOption = toggleButton.querySelector('.barras');
        
        if (circularOption && barrasOption) {
            if (isBarChart) {
                circularOption.classList.remove('active');
                barrasOption.classList.add('active');
            } else {
                circularOption.classList.add('active');
                barrasOption.classList.remove('active');
            }
        }
    }
}

function crearGraficoHorizontal() {
    const containerId = "chart-container-2";
    const containerSize = getContainerSize(containerId);

    const margin = {top: 40, right: 20, bottom: 40, left: 60};
    const width = containerSize.width - margin.left - margin.right;
    const height = containerSize.height - margin.top - margin.bottom;

    d3.select("#" + containerId).selectAll("svg").remove();

    const svg = d3.select("#" + containerId)
        .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1);
    const x = d3.scaleLinear()
        .range([0, width]);

    y.domain(data.map(d => d.categoria));
    x.domain([0, d3.max(data, d => d.valor2)]);

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.categoria))
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", d => x(d.valor2))
            .attr("fill", "#274361")
            .attr("rx", "7")
            .attr("ry", "7");

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Gráfico de Barras Horizontal");
}

function crearGraficoApilado() {
    const containerId = "chart-container-3";
    const containerSize = getContainerSize(containerId);

    const margin = {top: 40, right: 20, bottom: 40, left: 60};
    const width = containerSize.width - margin.left - margin.right;
    const height = containerSize.height - margin.top - margin.bottom;

    d3.select("#" + containerId).selectAll("svg").remove();

    const svg = d3.select("#" + containerId)
        .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    const y = d3.scaleLinear()
        .range([height, 0]);

    const stack = d3.stack().keys(["valor1", "valor2"]);
    const stackedData = stack(data);

    x.domain(data.map(d => d.categoria));
    y.domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]);

    const color = d3.scaleOrdinal()
        .domain(["valor1", "valor2"])
        .range(["#98abc5", "#274361"]);

    svg.selectAll("g")
        .data(stackedData)
        .enter().append("g")
            .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
            .attr("x", d => x(d.data.categoria))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Gráfico de Barras Apilado");
}


























// Función para inicializar todos los gráficos
function inicializarGraficos() {
    crearGraficoBarras();
    crearGraficoHorizontal();
    crearGraficoApilado();
}

// Inicializar los gráficos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarGraficos);

// Agregar event listener al botón
document.getElementById('toggle-chart').addEventListener('click', toggleChart);

// Redimensionar gráficos cuando cambie el tamaño de la ventana
window.addEventListener('resize', () => {
    inicializarGraficos();
});