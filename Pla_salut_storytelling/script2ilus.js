console.log("Script iniciado");

// Función para cargar datos desde CSV
async function loadData() {
  try {
    console.log("Intentando cargar CSV...");
    const response = await fetch('dataset_malestar_emocional_simulat_valor_absolut.csv');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log("CSV cargado, primeros 200 caracteres:", csvText.substring(0, 200));
    
    // Parsear CSV usando D3
    const data = d3.csvParse(csvText, d => ({
      Indicador: d.Indicador,
      Any: d.Any,
      Resposta: d.Resposta,
      Edat: d.Edat,
      Sexe: d.Sexe,
      "Classe social": d["Classe social"],
      Estudis: d.Estudis,
      Territoris: d.Territoris,
      percentatge: +d.percentatge,
      poblacio_absoluta: +d.poblacio_absoluta,
      mostra: +d.mostra,
      Valor: +d.valor_absolut
    }));
    
    console.log("Datos parseados:", data.length, "registros");
    console.log("Muestra de datos:", data.slice(0, 3));
    
    return data;
  } catch (error) {
    console.error("Error cargando el CSV:", error);
    return getSampleData();
  }
}

// Datos de ejemplo como fallback
function getSampleData() {
  console.log("Usando datos de ejemplo");
  return [
    { Any: "2023", Edat: "18-30", Sexe: "Home", "Classe social": "Mitjana", Estudis: "Universitaris", Territoris: "Barcelona", Resposta: "Sí", Valor: 15 },
    { Any: "2023", Edat: "18-30", Sexe: "Dona", "Classe social": "Mitjana", Estudis: "Universitaris", Territoris: "Barcelona", Resposta: "Sí", Valor: 10 },
    { Any: "2023", Edat: "31-50", Sexe: "Home", "Classe social": "Alta", Estudis: "Universitaris", Territoris: "Madrid", Resposta: "Sí", Valor: 20 },
    { Any: "2023", Edat: "31-50", Sexe: "Dona", "Classe social": "Baixa", Estudis: "Secundaris", Territoris: "València", Resposta: "Sí", Valor: 25 },
    { Any: "2024", Edat: "18-30", Sexe: "Home", "Classe social": "Mitjana", Estudis: "Universitaris", Territoris: "Barcelona", Resposta: "Sí", Valor: 12 },
    { Any: "2024", Edat: "50+", Sexe: "Dona", "Classe social": "Alta", Estudis: "Universitaris", Territoris: "Madrid", Resposta: "Sí", Valor: 18 },
    { Any: "2024", Edat: "31-50", Sexe: "Home", "Classe social": "Mitjana", Estudis: "Secundaris", Territoris: "València", Resposta: "Sí", Valor: 22 },
    { Any: "2024", Edat: "18-30", Sexe: "Dona", "Classe social": "Baixa", Estudis: "Primaris", Territoris: "Sevilla", Resposta: "Sí", Valor: 8 }
  ];
}

let currentData = [];
let selectedYear = "2023";
let isInitialLoad = true;

function initializeTabs(data) {
  console.log("Inicializando tabs");
  const years = [...new Set(data.map(d => d.Any))].sort();
  const tabsContainer = d3.select("#year-tabs");
  
  if (!years.includes(selectedYear)) {
    selectedYear = years[0];
  }
  
  tabsContainer.selectAll("*").remove();
  
  years.forEach(year => {
    tabsContainer.append("div")
      .attr("class", year === selectedYear ? "tab active" : "tab")
      .text(year)
      .on("click", () => {
        console.log("Clicked year:", year);
        selectedYear = year;
        isInitialLoad = true;
        updateTabs();
        
        // Resetear todos los filtros al cambiar de año
        resetAllFilters();
        
        updateFilters();
        renderPictograms(currentData);
        updateStats();
      });
  });
  console.log("Tabs creados para años:", years);
}

function resetAllFilters() {
  const selects = document.querySelectorAll('#filters select');
  selects.forEach(select => {
    select.value = "";
  });
}

function updateTabs() {
  d3.selectAll(".tab")
    .classed("active", false)
    .filter(function() { return d3.select(this).text() === selectedYear; })
    .classed("active", true);
}

function updateFilters() {
  console.log("Actualizando filtros");
  const yearData = currentData.filter(d => d.Any === selectedYear);
  
  const filterFields = [
    { id: "Edat", field: "Edat" },
    { id: "Sexe", field: "Sexe" },
    { id: "Classe_social", field: "Classe social" },
    { id: "Estudis", field: "Estudis" },
    { id: "Territoris", field: "Territoris" }
  ];

  filterFields.forEach(({ id, field }) => {
    const select = document.getElementById(id);
    if (!select) {
      console.error(`Select ${id} not found`);
      return;
    }
    
    // Limpiar opciones anteriores excepto la primera (vacía)
    select.innerHTML = '<option value="">Tots</option>';
    
    const uniqueValues = [...new Set(yearData.map(d => d[field]))].filter(v => v && v !== "").sort();
    
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    // Agregar event listener
    select.addEventListener('change', () => {
      console.log("Filtro cambiado:", field, select.value);
      isInitialLoad = false;
      renderPictograms(currentData);
      updateStats();
    });
  });
  console.log("Filtros actualizados");
}

function getSelectedFilters() {
  const selectedFilters = {};
  const selects = document.querySelectorAll('#filters select');
  
  selects.forEach(select => {
    if (select.value && select.value !== "") {
      const field = getFieldNameFromSelectId(select.id);
      selectedFilters[field] = [select.value];
    }
  });
  
  return selectedFilters;
}

function getFieldNameFromSelectId(selectId) {
  const fieldMap = {
    "Edat": "Edat",
    "Sexe": "Sexe", 
    "Classe_social": "Classe social",
    "Estudis": "Estudis",
    "Territoris": "Territoris"
  };
  return fieldMap[selectId] || selectId;
}

function getSelectedFiltersText() {
  const selectedFilters = getSelectedFilters();
  const filterTexts = [];
  
  Object.entries(selectedFilters).forEach(([field, values]) => {
    values.forEach(value => {
      filterTexts.push(`${field}: ${value}`);
    });
  });
  
  return filterTexts;
}

function updateStats() {
  const yearData = currentData.filter(d => d.Any === selectedYear);
  const selectedFilters = getSelectedFilters();
  
  // Solo procesar respuestas "Sí"
  const yesData = yearData.filter(d => d.Resposta === "Sí");
  const totalYes = d3.sum(yesData, d => d.Valor);
  
  let percentage = 100;
  
  if (Object.keys(selectedFilters).length > 0) {
    // Filtrar datos según selecciones
    const filteredData = yesData.filter(d => {
      return Object.entries(selectedFilters).every(([field, values]) => {
        return values.includes(d[field]);
      });
    });
    
    const filteredTotal = d3.sum(filteredData, d => d.Valor);
    percentage = Math.round((filteredTotal / totalYes) * 100);
  }
  
  document.getElementById('yes-count').textContent = percentage;
}

function renderPictograms(data) {
  console.log("Renderizando pictogramas");
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();

  const width = 1400;
  const columns = 25;
  const size = 48;
  const spacing = 6;
  const horizontalSpacing = -20;
  const labelX = columns * (size + horizontalSpacing) + 30; // Posición de las etiquetas

  const yearData = data.filter(d => d.Any === selectedYear);
  const selectedFilters = getSelectedFilters();

  // SOLO procesar respuestas "Sí"
  const yesData = yearData.filter(d => d.Resposta === "Sí");

  console.log("Selected filters:", selectedFilters);
  console.log("Yes data count:", yesData.length);

  // Calcular total de datos
  const totalYes = d3.sum(yesData, d => d.Valor);

  if (Object.keys(selectedFilters).length === 0) {
    // Sin filtros: mostrar todos los pictogramas normalmente
    console.log("Sin filtros seleccionados - mostrando todos");
    
    // Calcular proporción por sexo
    const sexCounts = d3.rollup(yesData, v => d3.sum(v, d => d.Valor), d => d.Sexe);
    
    // Crear 100 pictogramas según proporción de sexos
    const pictos = [];
    let pictogramId = 0;

    Array.from(sexCounts).forEach(([sexo, count]) => {
      const proportion = Math.round((count / totalYes) * 100);
      for (let i = 0; i < proportion; i++) {
        pictos.push({
          resposta: "Sí",
          sexo: sexo,
          included: true,
          id: pictogramId++
        });
      }
    });

    // Completar hasta 100 si es necesario
    while (pictos.length < 100) {
      const randomSex = Math.random() > 0.5 ? "Home" : "Dona";
      pictos.push({
        resposta: "Sí",
        sexo: randomSex,
        included: true,
        id: pictos.length
      });
    }

    // Dibujar pictogramas
    const group = svg.append("g").attr("transform", "translate(25, 20)");

    const picto = group.selectAll("g.person")
      .data(pictos, d => d.id)
      .join("g")
      .attr("class", "person")
      .attr("opacity", 1);

    if (isInitialLoad) {
      // Transición inicial
      picto.attr("transform", (d, i) => {
        const randomX = Math.random() * width - 100;
        const randomY = Math.random() * 300 - 50;
        return `translate(${randomX}, ${randomY})`;
      });
      
      picto.classed("transitioning", true);
      
      setTimeout(() => {
        picto.attr("transform", (d, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);
          return `translate(${col * (size + horizontalSpacing)}, ${row * (size + spacing)})`;
        });
        
        setTimeout(() => {
          picto.classed("transitioning", false);
          isInitialLoad = false;
        }, 5000);
      }, 50);
      
    } else {
      // Sin transición especial cuando no hay filtros
      picto.attr("transform", (d, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        return `translate(${col * (size + horizontalSpacing)}, ${row * (size + spacing)})`;
      });
    }

    // Crear imágenes SVG
    picto.append("image")
      .attr("href", d => {
        const isHome = d.sexo === "Home" || d.sexo === "Hombre";
        if (isHome) {
          const randomNum = Math.floor(Math.random() * 5) + 1;
          const numFormatted = randomNum.toString().padStart(2, '0');
          return `./img/home--${numFormatted}.svg`;
        } else {
          const randomNum = Math.floor(Math.random() * 5) + 1;
          const numFormatted = randomNum.toString().padStart(2, '0');
          return `./img/dona--${numFormatted}.svg`;
        }
      })
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size)
      .attr("height", size);

  } else {
    // Con filtros: crear pictogramas según los datos filtrados
    console.log("Con filtros seleccionados - creando pictogramas según filtros");
    
    // Filtrar datos según selecciones
    const filteredData = yesData.filter(d => {
      return Object.entries(selectedFilters).every(([field, values]) => {
        return values.includes(d[field]);
      });
    });

    console.log("Filtered data:", filteredData);

    // Crear pictogramas basados en los datos FILTRADOS
    const filteredSexCounts = d3.rollup(filteredData, v => d3.sum(v, d => d.Valor), d => d.Sexe);
    const filteredTotal = d3.sum(filteredData, d => d.Valor);
    const totalIncluded = Math.round((filteredTotal / totalYes) * 100);

    console.log("Filtered sex counts:", Array.from(filteredSexCounts));
    console.log("Total included:", totalIncluded);

    // Crear todos los pictogramas (incluidos + excluidos)
    const allSexCounts = d3.rollup(yesData, v => d3.sum(v, d => d.Valor), d => d.Sexe);
    const pictos = [];
    let pictogramId = 0;

    // Primero crear los incluidos según los datos filtrados
    const includedPictos = [];
    Array.from(filteredSexCounts).forEach(([sexo, count]) => {
      const proportion = Math.round((count / totalYes) * 100);
      console.log(`Creating ${proportion} pictograms for ${sexo} (included)`);
      for (let i = 0; i < proportion; i++) {
        includedPictos.push({
          resposta: "Sí",
          sexo: sexo,
          included: true,
          id: pictogramId++
        });
      }
    });

    // Luego crear los excluidos para completar hasta 100
    const excludedCount = 100 - includedPictos.length;
    const excludedPictos = [];
    
    // Para los excluidos, usar la proporción original completa
    Array.from(allSexCounts).forEach(([sexo, count]) => {
      const proportion = Math.round((count / totalYes) * (excludedCount / 100));
      console.log(`Creating ${proportion} pictograms for ${sexo} (excluded)`);
      for (let i = 0; i < proportion; i++) {
        excludedPictos.push({
          resposta: "Sí",
          sexo: sexo,
          included: false,
          id: pictogramId++
        });
      }
    });

    // Ajustar excluidos si es necesario
    while (excludedPictos.length < excludedCount) {
      const randomSex = Math.random() > 0.5 ? "Home" : "Dona";
      excludedPictos.push({
        resposta: "Sí",
        sexo: randomSex,
        included: false,
        id: pictogramId++
      });
    }

    // Combinar todos los pictogramas
    const allPictos = [...includedPictos, ...excludedPictos];

    // Dibujar pictogramas
    const group = svg.append("g").attr("transform", "translate(25, 20)");

    // Agregar etiquetas laterales para filtros activos
    if (totalIncluded > 0) {
      // Etiqueta con el valor (bold, 16px)
      group.append("text")
        .attr("x", labelX)
        .attr("y", 30)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#2b6cb0")
        .text(`${totalIncluded}%`);

      // Etiquetas con los nombres de variables (12px, gris)
      const filterTexts = getSelectedFiltersText();
      filterTexts.forEach((filterText, index) => {
        group.append("text")
          .attr("x", labelX)
          .attr("y", 50 + (index * 16))
          .style("font-size", "12px")
          .style("font-weight", "normal")
          .style("fill", "#666666")
          .text(filterText);
      });
    }

    const picto = group.selectAll("g.person")
      .data(allPictos, d => d.id)
      .join("g")
      .attr("class", "person")
      .attr("opacity", d => d.included ? 1 : 0.3);

    // Transición de filtro con dispersión y GIFs
    picto.attr("transform", (d, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return `translate(${col * (size + horizontalSpacing)}, ${row * (size + spacing)})`;
    });
    
    picto.classed("transitioning", true);
    
    // Fase 1: Dispersión con GIFs animados
    setTimeout(() => {
      picto.each(function(d, i) {
        const element = d3.select(this);
        
        // Dispersar todos aleatoriamente
        const randomX = Math.random() * width - 100;
        const randomY = Math.random() * 300 - 50;
        element.attr("transform", `translate(${randomX}, ${randomY})`);
        
        // Solo los descartados muestran GIFs animados
        if (!d.included) {
          element.select("image").transition().duration(1000).attr("opacity", 0);
          
          // GIFs animados específicos para la transición
          const isHome = d.sexo === "Home" || d.sexo === "Hombre";
          const animatedGif = isHome ? "home-1-1.gif" : "dona-1-1.gif";
          
          element.append("image")
            .attr("class", "animated-gif")
            .attr("href", `./img/${animatedGif}`)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", size)
            .attr("height", size)
            .attr("opacity", 0)
            .transition()
            .duration(1000)
            .attr("opacity", 1);
        }
      });
      
      // Fase 2: Reagrupar en posiciones finales
      setTimeout(() => {
        const includedPictosFiltered = allPictos.filter(p => p.included);
        const excludedPictosFiltered = allPictos.filter(p => !p.included);
        
        picto.each(function(d, i) {
          const element = d3.select(this);
          
          if (d.included) {
            // Incluidos: arriba-izquierda
            const includedIndex = includedPictosFiltered.findIndex(p => p.id === d.id);
            const col = includedIndex % columns;
            const row = Math.floor(includedIndex / columns);
            const finalX = col * (size + horizontalSpacing);
            const finalY = row * (size + spacing);
            
            element.transition()
              .duration(1500)
              .ease(d3.easeQuadOut)
              .attr("transform", `translate(${finalX}, ${finalY})`)
              .attr("opacity", 1);
            
          } else {
            // Excluidos: abajo agrupados
            const excludedIndex = excludedPictosFiltered.findIndex(p => p.id === d.id);
            const col = excludedIndex % columns;
            const includedRows = Math.ceil(includedPictosFiltered.length / columns);
            const separationRows = 2;
            const row = includedRows + separationRows + Math.floor(excludedIndex / columns);
            const finalX = col * (size + horizontalSpacing);
            const finalY = row * (size + spacing);
            
            element.transition()
              .duration(1500)
              .ease(d3.easeQuadOut)
              .attr("transform", `translate(${finalX}, ${finalY})`)
              .attr("opacity", 0.5);
            
            // Remover GIF animado y restaurar imagen original
            setTimeout(() => {
              element.select(".animated-gif").transition().duration(1000).attr("opacity", 0).remove();
              element.select("image:not(.animated-gif)").transition().duration(1000).attr("opacity", 0.5);
            }, 1500);
          }
        });
        
        setTimeout(() => {
          picto.classed("transitioning", false);
        }, 3000);
      }, 2500);
    }, 50);

    // Crear imágenes SVG estáticas
    picto.append("image")
      .attr("href", d => {
        const isHome = d.sexo === "Home" || d.sexo === "Hombre";
        if (isHome) {
          const randomNum = Math.floor(Math.random() * 5) + 1;
          const numFormatted = randomNum.toString().padStart(2, '0');
          return `./img/home--${numFormatted}.svg`;
        } else {
          const randomNum = Math.floor(Math.random() * 5) + 1;
          const numFormatted = randomNum.toString().padStart(2, '0');
          return `./img/dona--${numFormatted}.svg`;
        }
      })
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size)
      .attr("height", size);
  }

  // Ajustar altura del SVG
  const minHeight = 350;
  const contentHeight = Math.max(minHeight, 500);
  d3.select("#chart").attr("height", contentHeight);

  console.log("Pictogramas renderizados");
}

async function init() {
  console.log("Iniciando aplicación");
  try {
    currentData = await loadData();
    
    if (currentData.length > 0) {
      initializeTabs(currentData);
      updateFilters();
      renderPictograms(currentData);
      updateStats();
      isInitialLoad = false;
      console.log("Aplicación iniciada correctamente");
    } else {
      console.error("No se pudieron cargar los datos");
    }
  } catch (error) {
    console.error("Error en init:", error);
  }
}

// Esperar a que D3 esté disponible y el DOM esté listo
if (typeof d3 !== 'undefined') {
  console.log("D3 disponible");
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
} else {
  console.error("D3 no está disponible");
}

console.log("Script terminado");