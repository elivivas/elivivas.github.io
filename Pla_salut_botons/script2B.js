let currentData = [];
let currentView = "eixos"; // "eixos" o "perfils"
let currentInequalityAxis = "Edat"; // Variable activa per eixos de desigualtat

// Variables per gestionar perfils
let savedProfiles = [];
const maxProfiles = 3;
let showVariation = false; // Variable per controlar si mostrem variació

// Colors per perfils
const profileColors = {
  "Tots": "#6b6664",      // Gris per dades generals
  "Home": "#306977",      // Blau per homes  
  "Dona": "#873106"       // Marró per dones
};

// Funció per cargar el CSV - Con fallback a datos de ejemplo
async function loadCSV() {
  console.log("Intentant carregar CSV...");
  
  try {
    const response = await fetch('dataset_malestar_emocional_simulat_valor_absolut.csv');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log("✅ CSV carregat exitosament, mida:", csvText.length, "caràcters");
    
    // Parsear CSV
    const data = d3.csvParse(csvText, d => {
      return {
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
      };
    });
    
    console.log("✅ Dades parsejades:", data.length, "registres");
    console.log("📊 Mostra de dades:", data.slice(0, 3));
    
    return data;
    
  } catch (error) {
    console.warn("⚠️ No s'ha pogut carregar el CSV, usant dades d'exemple:", error.message);
    console.log("💡 Per usar el CSV real, assegura't d'obrir amb Live Server o servidor local");
    
    // Generar datos de ejemplo realistas
    return generateSampleData();
  }
}

// Función para generar datos de ejemplo
function generateSampleData() {
  console.log("🔄 Generant dades d'exemple basades en l'estructura del CSV...");
  
  const sampleData = [];
  const years = ["2020", "2021", "2022", "2023", "2024"];
  const edades = ["16-24", "25-34", "35-49", "50-64", "65+"];
  const sexos = ["Home", "Dona"];
  const clases = ["Baixa", "Mitjana baixa", "Mitjana", "Mitjana alta", "Alta"];
  const estudios = ["Sense estudis", "Primaris", "Secundaris", "Universitaris"];
  const territorios = ["Barcelona", "Girona", "Lleida", "Tarragona"];
  
  years.forEach(year => {
    edades.forEach(edad => {
      sexos.forEach(sexo => {
        clases.forEach(clase => {
          estudios.forEach(estudio => {
            territorios.forEach(territorio => {
              // Simular percentatges realistes de malestar emocional
              const baseRate = sexo === "Dona" ? 0.28 : 0.22;
              const ageMultiplier = edad === "16-24" ? 1.4 : 
                                   edad === "25-34" ? 1.2 : 
                                   edad === "35-49" ? 1.0 : 0.8;
              const classMultiplier = clase === "Baixa" ? 1.3 : 
                                     clase === "Alta" ? 0.7 : 1.0;
              
              const siRate = Math.min(0.5, baseRate * ageMultiplier * classMultiplier + 
                                         (Math.random() * 0.06 - 0.03));
              const totalPopulation = Math.floor(Math.random() * 120) + 40;
              
              const siValue = Math.floor(totalPopulation * siRate);
              const noValue = totalPopulation - siValue;
              
              // Agregar registro para "Sí"
              if (siValue > 0) {
                sampleData.push({
                  Indicador: "Malestar emocional",
                  Any: year,
                  Edat: edad,
                  Sexe: sexo,
                  "Classe social": clase,
                  Estudis: estudio,
                  Territoris: territorio,
                  Resposta: "Sí",
                  percentatge: (siValue / totalPopulation) * 100,
                  poblacio_absoluta: totalPopulation,
                  mostra: totalPopulation,
                  Valor: siValue
                });
              }
              
              // Agregar registro para "No"
              if (noValue > 0) {
                sampleData.push({
                  Indicador: "Malestar emocional",
                  Any: year,
                  Edat: edad,
                  Sexe: sexo,
                  "Classe social": clase,
                  Estudis: estudio,
                  Territoris: territorio,
                  Resposta: "No",
                  percentatge: (noValue / totalPopulation) * 100,
                  poblacio_absoluta: totalPopulation,
                  mostra: totalPopulation,
                  Valor: noValue
                });
              }
            });
          });
        });
      });
    });
  });
  
  console.log("✅ Dades d'exemple generades:", sampleData.length, "registres");
  console.log("📊 Estructura similar al CSV real amb valors realistes");
  
  return sampleData;
}

// Nova funcionalitat per gestionar les vistes
function initializeViews() {
  const eixosBtn = document.getElementById("eixos-btn");
  const perfilsBtn = document.getElementById("perfils-btn");
  const inequalityTabs = document.getElementById("inequality-tabs");
  const addProfileSection = document.getElementById("add-profile-section");
  
  eixosBtn.addEventListener('click', () => {
    currentView = "eixos";
    eixosBtn.classList.add('active');
    perfilsBtn.classList.remove('active');
    inequalityTabs.style.display = 'flex';
    addProfileSection.style.display = 'none';
    renderCurrentView();
  });
  
  perfilsBtn.addEventListener('click', () => {
    currentView = "perfils";
    perfilsBtn.classList.add('active');
    eixosBtn.classList.remove('active');
    inequalityTabs.style.display = 'none';
    addProfileSection.style.display = 'block';
    initializeProfileComparison();
    renderCurrentView();
  });
}

// Gestionar pestanyes d'eixos de desigualtat
function initializeInequalityTabs() {
  const tabs = document.querySelectorAll('.inequality-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Actualitzar pestanya activa
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Actualitzar variable activa
      currentInequalityAxis = tab.dataset.variable;
      
      // Re-renderitzar
      renderCurrentView();
    });
  });
}

// Funció per renderitzar segons la vista actual
function renderCurrentView() {
  if (currentView === "eixos") {
    renderInequalityAxes();
  } else {
    renderProfileComparison();
  }
}

// Nova funció per "Per eixos de desigualtat"
function renderInequalityAxes() {
  console.log("📊 Renderitzant vista per eixos de desigualtat...");
  
  const svg = d3.select("#histogram");
  svg.selectAll("*").remove();
  
  const margin = { top: 40, right: 50, bottom: 80, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Obtenir dades filtrades només per sexe
  const sexeFilter = document.getElementById("Sexe").value;
  const filteredData = currentData.filter(d => 
    sexeFilter === "Tots" || d.Sexe === sexeFilter
  );
  
  console.log("🔍 Dades filtrades per sexe:", filteredData.length, "registres");
  console.log("📊 Eix actiu:", currentInequalityAxis);
  
  const histogramData = processInequalityData(filteredData, currentInequalityAxis, sexeFilter);
  
  if (histogramData.length === 0) {
    svg.append("text")
      .attr("x", 400)
      .attr("y", 200)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#666")
      .text("No hi ha dades disponibles per mostrar");
    return;
  }
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Escalas
  const xScale = d3.scalePoint()
    .domain(histogramData.years)
    .range([0, width])
    .padding(0.1);
  
  const maxValue = d3.max(histogramData.categories.flatMap(cat => 
    histogramData.years.map(year => cat.data[year] || 0)
  ));
  
  const yScale = d3.scaleLinear()
    .domain([0, Math.ceil(maxValue / 10) * 10])
    .range([height, 0]);
  
  // Grid i eixos
  const yTicks = yScale.ticks(6);
  g.selectAll(".grid-line")
    .data(yTicks)
    .enter().append("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 1);
  
  // Línies verticals
  histogramData.years.forEach(year => {
    g.append("line")
      .attr("class", "vertical-line")
      .attr("x1", xScale(year))
      .attr("x2", xScale(year))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.5);
  });
  
  // Eixos
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickPadding(15));
  
  xAxis.selectAll("text")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("fill", "#333");
  
  const yAxis = g.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => d + "%")
      .tickSize(0)
      .tickPadding(10)
      .ticks(6));
  
  yAxis.selectAll("text")
    .style("font-size", "16px")
    .style("font-weight", "500")
    .style("fill", "#666");
  
  g.selectAll(".domain").remove();
  
  const tooltip = d3.select("#tooltip");
  
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveLinear);
  
  // Dibuixar línies per cada categoria
  histogramData.categories.forEach((category, index) => {
    const lineData = histogramData.years.map(year => ({
      year: year,
      value: category.data[year] || 0
    }));
    
    console.log(`📈 Línia ${category.name}:`, lineData);
    
    // Dibuixar línia
    const path = g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", category.color)
      .attr("stroke-width", 4)
      .attr("d", line);
    
    // Animació
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
    
    // Punts
    const circles = g.selectAll(`.dot-${category.name.replace(/\s+/g, '-')}`)
      .data(lineData)
      .enter().append("circle")
      .attr("class", `dot-${category.name.replace(/\s+/g, '-')}`)
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.value))
      .attr("r", 0)
      .attr("fill", category.color)
      .attr("stroke", "white")
      .attr("stroke-width", 3);
    
    circles.transition()
      .delay(2000 + (index * 200))
      .duration(500)
      .attr("r", 8);
    
    // Tooltips
    circles
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1)
          .html(`<strong>${d.year}</strong><br>
                 ${category.name}: <strong>${d.value.toFixed(1)}%</strong>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        
        d3.select(this).transition().duration(150).attr("r", 10);
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this).transition().duration(150).attr("r", 8);
      });
  });
  
  // Actualitzar llegenda
  updateInequalityLegend(histogramData.categories);
}

// Processar dades per eixos de desigualtat
function processInequalityData(filteredData, axis, sexeFilter) {
  console.log("📊 Processant dades per eix:", axis);
  
  // Agrupar per any, variable de l'eix i resposta
  const byYearAxisResponse = d3.rollup(filteredData, 
    v => d3.sum(v, d => d.Valor), 
    d => d.Any, 
    d => d[axis === "Classe_social" ? "Classe social" : axis], 
    d => d.Resposta
  );
  
  const years = Array.from(byYearAxisResponse.keys()).sort();
  
  // Obtenir totes les categories de l'eix
  const allCategories = new Set();
  byYearAxisResponse.forEach(yearData => {
    yearData.forEach((responses, category) => {
      if (category && category !== "") {
        allCategories.add(category);
      }
    });
  });
  
  const categories = Array.from(allCategories).sort();
  console.log("📋 Categories trobades:", categories);
  
  // Determinar colors segons el sexe filtrat
  const baseColors = getColorGradient(sexeFilter, categories.length);
  
  // Processar dades per cada categoria
  const processedCategories = categories.map((category, index) => {
    const categoryData = {};
    
    years.forEach(year => {
      const yearData = byYearAxisResponse.get(year);
      const categoryYearData = yearData ? yearData.get(category) : null;
      
      if (categoryYearData) {
        const siTotal = categoryYearData.get("Sí") || 0;
        const noTotal = categoryYearData.get("No") || 0;
        const total = siTotal + noTotal;
        
        categoryData[year] = total > 0 ? (siTotal / total) * 100 : 0;
      } else {
        categoryData[year] = 0;
      }
    });
    
    return {
      name: category,
      data: categoryData,
      color: baseColors[index]
    };
  });
  
  return {
    years: years,
    categories: processedCategories
  };
}

// Generar gradació de colors amb colors foscos
function getColorGradient(sexeFilter, numCategories) {
  let baseColor;
  
  // Determinar color base segons el sexe (colors foscos)
  if (sexeFilter === "Tots") {
    baseColor = [107, 102, 100]; // Gris #6b6664
  } else if (sexeFilter.toLowerCase().includes('home') || 
             sexeFilter.toLowerCase().includes('masculí')) {
    baseColor = [48, 105, 119]; // Blau fosc #306977
  } else if (sexeFilter.toLowerCase().includes('dona') || 
             sexeFilter.toLowerCase().includes('femen')) {
    baseColor = [135, 49, 6]; // Marró fosc #873106
  } else {
    baseColor = [107, 102, 100]; // Per defecte gris
  }
  
  const colors = [];
  
  for (let i = 0; i < numCategories; i++) {
    // Crear gradació de fosc a clar
    const factor = numCategories === 1 ? 1 : 0.4 + (0.6 * i / (numCategories - 1));
    const adjustedColor = baseColor.map(c => Math.round(c + (255 - c) * (1 - factor)));
    colors.push(`rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`);
  }
  
  return colors;
}

// Actualitzar llegenda per eixos de desigualtat
function updateInequalityLegend(categories) {
  const legend = d3.select("#histogram-legend");
  legend.selectAll("*").remove();
  
  categories.forEach(category => {
    const legendItem = legend.append("div")
      .attr("class", "legend-item");
    
    legendItem.append("div")
      .attr("class", "legend-color")
      .style("background-color", category.color);
    
    legendItem.append("span")
      .text(category.name);
  });
}

// Inicialitzar la comparació de perfils
function initializeProfileComparison() {
  const addBtn = document.getElementById("add-profile-btn");
  
  // Eliminar esdeveniments previs
  addBtn.replaceWith(addBtn.cloneNode(true));
  const newAddBtn = document.getElementById("add-profile-btn");
  
  newAddBtn.addEventListener('click', () => {
    addCurrentProfile();
  });
  
  updateProfileCounter();
  renderProfileList();
  initializeVariationButton();
  updateVariationButtonVisibility();
}

// Afegir perfil actual
function addCurrentProfile() {
  if (savedProfiles.length >= maxProfiles) {
    alert(`Màxim ${maxProfiles} perfils permesos`);
    return;
  }
  
  // Obtenir filtres actuals
  const currentFilters = {
    Edat: document.getElementById("Edat").value,
    Sexe: document.getElementById("Sexe").value,
    Classe_social: document.getElementById("Classe_social").value,
    Estudis: document.getElementById("Estudis").value,
    Territoris: document.getElementById("Territoris").value
  };
  
  // Crear descripció del perfil
  const profileDescription = createProfileDescription(currentFilters);
  
  // Determinar color segons el sexe
  let profileColor = profileColors["Tots"]; // Per defecte gris
  if (currentFilters.Sexe !== "Tots") {
    profileColor = profileColors[currentFilters.Sexe] || profileColors["Tots"];
  }
  
  // Processar dades del perfil
  const profileData = processProfileData(currentFilters);
  
  if (profileData.years.length === 0) {
    alert("No hi ha dades per aquest perfil");
    return;
  }
  
  // Afegir perfil
  const profile = {
    id: Date.now(),
    filters: {...currentFilters},
    description: profileDescription,
    color: profileColor,
    data: profileData
  };
  
  savedProfiles.push(profile);
  
  updateProfileCounter();
  renderProfileList();
  renderCurrentView();
  updateVariationButtonVisibility();
  console.log("✅ Perfil afegit:", profile.description);
}

// Crear descripció del perfil
function createProfileDescription(filters) {
  const parts = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "Tots") {
      const label = key === "Classe_social" ? "Classe Social" : key;
      parts.push(`${label}: ${value}`);
    }
  });
  
  return parts.length > 0 ? parts.join(", ") : "Tots els grups";
}

// Processar dades per un perfil específic
function processProfileData(filters) {
  // Filtrar dades segons els filtres del perfil
  const filteredData = currentData.filter(d => {
    return (filters.Edat === "Tots" || d.Edat === filters.Edat) &&
           (filters.Sexe === "Tots" || d.Sexe === filters.Sexe) &&
           (filters.Classe_social === "Tots" || d["Classe social"] === filters.Classe_social) &&
           (filters.Estudis === "Tots" || d.Estudis === filters.Estudis) &&
           (filters.Territoris === "Tots" || d.Territoris === filters.Territoris);
  });
  
  // Agrupar per any i resposta
  const byYearResponse = d3.rollup(filteredData, 
    v => d3.sum(v, d => d.Valor), 
    d => d.Any, 
    d => d.Resposta
  );
  
  const years = Array.from(byYearResponse.keys()).sort();
  const yearlyData = {};
  
  years.forEach(year => {
    const yearData = byYearResponse.get(year) || new Map();
    const siTotal = yearData.get("Sí") || 0;
    const noTotal = yearData.get("No") || 0;
    const total = siTotal + noTotal;
    
    yearlyData[year] = total > 0 ? (siTotal / total) * 100 : 0;
  });
  
  return {
    years: years,
    data: yearlyData
  };
}

// Eliminar perfil
function removeProfile(profileId) {
  savedProfiles = savedProfiles.filter(p => p.id !== profileId);
  updateProfileCounter();
  renderProfileList();
  renderCurrentView();
  updateVariationButtonVisibility();
  console.log("🗑️ Perfil eliminat");
}

// Actualitzar comptador de perfils
function updateProfileCounter() {
  const counter = document.getElementById("profile-counter");
  const addBtn = document.getElementById("add-profile-btn");
  
  if (counter) {
    counter.textContent = `${savedProfiles.length}/${maxProfiles} perfils afegits`;
  }
  
  if (addBtn) {
    addBtn.disabled = savedProfiles.length >= maxProfiles;
    addBtn.textContent = savedProfiles.length >= maxProfiles ? 
      "Màxim perfils afegits" : "Afegir al gràfic";
  }
}

// Renderitzar llista de perfils
function renderProfileList() {
  const profileList = document.getElementById("profile-list");
  
  if (!profileList) return;
  
  profileList.innerHTML = '';
  
  savedProfiles.forEach(profile => {
    const profileItem = document.createElement('div');
    profileItem.className = 'profile-item';
    
    profileItem.innerHTML = `
      <div class="profile-info">
        <div class="profile-color" style="background-color: ${profile.color};"></div>
        <span>${profile.description}</span>
      </div>
      <button class="profile-remove" data-profile-id="${profile.id}">×</button>
    `;
    
    // Afegir esdeveniment de clic al botó eliminar
    const removeBtn = profileItem.querySelector('.profile-remove');
    removeBtn.addEventListener('click', () => {
      removeProfile(profile.id);
    });
    
    profileList.appendChild(profileItem);
  });
}

// Restaurar llegenda original amb colors foscos
function restoreOriginalLegend() {
  const legend = d3.select("#histogram-legend");
  legend.selectAll("*").remove();
  
  // Llegenda original amb colors foscos
  const originalLegend = [
    { color: "#6b6664", label: "Dades Generals" },
    { color: "#20484c", label: "Homes" },
    { color: "#4b1d03", label: "Dones" }
  ];
  
  originalLegend.forEach(item => {
    const legendItem = legend.append("div")
      .attr("class", "legend-item");
    
    legendItem.append("div")
      .attr("class", "legend-color")
      .style("background-color", item.color);
    
    legendItem.append("span")
      .text(item.label);
  });
}

// Función para poblar los filtros
function populateFilters(data) {
  console.log("🔧 Poblant filtres...");
  
  const filterFields = [
    { id: "Edat", field: "Edat", label: "Edat" },
    { id: "Sexe", field: "Sexe", label: "Sexe" },
    { id: "Classe_social", field: "Classe social", label: "Classe Social" },
    { id: "Estudis", field: "Estudis", label: "Estudis" },
    { id: "Territoris", field: "Territoris", label: "Territori" }
  ];

  filterFields.forEach(({ id, field, label }) => {
    const selectElement = document.getElementById(id);
    
    if (!selectElement) {
      console.error(`❌ Element #${id} no trobat`);
      return;
    }
    
    // Obtenir valors únics i filtrar valors buits
    const allValues = data.map(d => d[field]).filter(v => v != null && v !== "");
    const uniqueValues = [...new Set(allValues)].sort();
    
    console.log(`📋 ${label}: ${uniqueValues.length} valors únics`);
    
    // Netejar select completament
    selectElement.innerHTML = '';
    
    // Agregar opció "Tots"
    const totsOption = document.createElement('option');
    totsOption.value = "Tots";
    totsOption.textContent = "Tots";
    selectElement.appendChild(totsOption);
    
    // Agregar cada valor únic
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });
    
    console.log(`✅ Filtre ${label} poblat amb ${uniqueValues.length + 1} opcions`);
    
    // Agregar esdeveniment de canvi
    selectElement.addEventListener('change', function() {
      console.log(`🔄 Filtre ${label} canviat a: "${this.value}"`);
      renderCurrentView();
    });
  });
  
  console.log("✅ Tots els filtres poblats correctament");
}

// Funció per "Comparar perfils"
function renderProfileComparison() {
  console.log("📊 Renderitzant vista 'Comparar perfils'...");
  
  const svg = d3.select("#histogram");
  svg.selectAll("*").remove();
  
  const margin = { top: 60, right: 50, bottom: 80, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Si no hi ha perfils, només mostrar eixos buits
  if (savedProfiles.length === 0) {
    renderEmptyChart(g, width, height);
    updateProfileComparisonLegend([]);
    return;
  }
  
  // Obtenir tots els anys de tots els perfils
  const allYears = [...new Set(savedProfiles.flatMap(p => p.data.years))].sort();
  
  // Escalas
  const xScale = d3.scalePoint()
    .domain(allYears)
    .range([0, width])
    .padding(0.1);
  
  const maxValue = d3.max(savedProfiles.flatMap(p => 
    p.data.years.map(year => p.data.data[year] || 0)
  ));
  
  const yScale = d3.scaleLinear()
    .domain([0, Math.ceil((maxValue || 50) / 10) * 10])
    .range([height, 0]);
  
  // Grid i eixos
  const yTicks = yScale.ticks(6);
  g.selectAll(".grid-line")
    .data(yTicks)
    .enter().append("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 1);
  
  // Línies verticals
  allYears.forEach(year => {
    g.append("line")
      .attr("class", "vertical-line")
      .attr("x1", xScale(year))
      .attr("x2", xScale(year))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.5);
  });
  
  // Text explicatiu de variació (si està activa)
  if (showVariation) {
    g.append("text")
      .attr("class", "variation-explanation")
      .attr("x", 0)
      .attr("y", -20)
      .text("Variació en punts percentuals respecte l'any anterior")
      .style("font-size", "11px")
      .style("fill", "#6c757d")
      .style("font-style", "italic");
  }
  
  // Eixos
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickPadding(15));
  
  xAxis.selectAll("text")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("fill", "#333");
  
  const yAxis = g.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => d + "%")
      .tickSize(0)
      .tickPadding(10)
      .ticks(6));
  
  yAxis.selectAll("text")
    .style("font-size", "16px")
    .style("font-weight", "500")
    .style("fill", "#666");
  
  g.selectAll(".domain").remove();
  
  const tooltip = d3.select("#tooltip");
  
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveLinear);
  
  // Dibuixar línies per cada perfil
  savedProfiles.forEach((profile, index) => {
    const lineData = allYears.map(year => ({
      year: year,
      value: profile.data.data[year] || 0
    }));
    
    console.log(`📈 Perfil ${index + 1}:`, lineData);
    
    // Dibuixar línia
    const path = g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", profile.color)
      .attr("stroke-width", 4)
      .attr("d", line);
    
    // Animació
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
    
    // Punts
    const circles = g.selectAll(`.dot-profile-${profile.id}`)
      .data(lineData)
      .enter().append("circle")
      .attr("class", `dot-profile-${profile.id}`)
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.value))
      .attr("r", 0)
      .attr("fill", profile.color)
      .attr("stroke", "white")
      .attr("stroke-width", 3);
    
    circles.transition()
      .delay(2000 + (index * 200))
      .duration(500)
      .attr("r", 8);
    
    // Tooltips
    circles
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1)
          .html(`<strong>${d.year}</strong><br>
                 ${profile.description}: <strong>${d.value.toFixed(1)}%</strong>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        
        d3.select(this).transition().duration(150).attr("r", 10);
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this).transition().duration(150).attr("r", 8);
      });
    
    // Mostrar caixes de variació si està activat
    if (showVariation) {
      const variations = calculateVariation(profile.data);
      
      Object.entries(variations).forEach(([year, variation]) => {
        if (allYears.includes(year)) {
          const x = xScale(year);
          const y = yScale(profile.data.data[year] || 0);
          
          // Crear caixa de variació
          const variationGroup = g.append("g")
            .attr("class", "variation-group");
          
          const box = variationGroup.append("rect")
            .attr("x", x - 20)
            .attr("y", y - 28)
            .attr("width", 40)
            .attr("height", 18)
            .attr("rx", 3)
            .attr("fill", "rgba(0, 0, 0, 0.85)")
            .attr("stroke", "none");
          
          const text = variationGroup.append("text")
            .attr("x", x)
            .attr("y", y - 15)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .attr("font-family", "'Segoe UI', sans-serif")
            .text((variation > 0 ? "+" : "") + variation.toFixed(1));
          
          // Fletxa cap avall
          variationGroup.append("polygon")
            .attr("points", `${x-3},${y-10} ${x+3},${y-10} ${x},${y-5}`)
            .attr("fill", "rgba(0, 0, 0, 0.85)");
        }
      });
    }
  });
  
  // Actualitzar llegenda
  updateProfileComparisonLegend(savedProfiles);
}

// Renderitzar gràfic buit
function renderEmptyChart(g, width, height) {
  // Només eixos buits amb anys d'exemple
  const exampleYears = ["2020", "2021", "2022", "2023", "2024"];
  
  const xScale = d3.scalePoint()
    .domain(exampleYears)
    .range([0, width])
    .padding(0.1);
  
  const yScale = d3.scaleLinear()
    .domain([0, 50])
    .range([height, 0]);
  
  // Grid
  const yTicks = yScale.ticks(6);
  g.selectAll(".grid-line")
    .data(yTicks)
    .enter().append("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 1);
  
  // Eixos
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickPadding(15));
  
  xAxis.selectAll("text")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("fill", "#333");
  
  const yAxis = g.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => d + "%")
      .tickSize(0)
      .tickPadding(10)
      .ticks(6));
  
  yAxis.selectAll("text")
    .style("font-size", "16px")
    .style("font-weight", "500")
    .style("fill", "#666");
  
  g.selectAll(".domain").remove();
  
  // Missatge informatiu
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#adb5bd")
    .style("font-style", "italic")
    .text("Selecciona filtres i fes clic a 'Afegir al gràfic'");
}

// Actualitzar llegenda per comparació de perfils
function updateProfileComparisonLegend(profiles) {
  const legend = d3.select("#histogram-legend");
  legend.selectAll("*").remove();
  
  if (profiles.length === 0) {
    // Llegenda buida o per defecte
    const emptyItem = legend.append("div")
      .attr("class", "legend-item");
    
    emptyItem.append("div")
      .attr("class", "legend-color")
      .style("background-color", "#e9ecef");
    
    emptyItem.append("span")
      .style("color", "#adb5bd")
      .text("Cap perfil seleccionat");
    return;
  }
  
  profiles.forEach(profile => {
    const legendItem = legend.append("div")
      .attr("class", "legend-item");
    
    legendItem.append("div")
      .attr("class", "legend-color")
      .style("background-color", profile.color);
    
    legendItem.append("span")
      .text(profile.description);
  });
}

// Inicialitzar botó de variació
function initializeVariationButton() {
  const variationBtn = document.getElementById("variation-btn");
  
  if (!variationBtn) return;
  
  // Eliminar esdeveniments previs
  variationBtn.replaceWith(variationBtn.cloneNode(true));
  const newVariationBtn = document.getElementById("variation-btn");
  
  newVariationBtn.addEventListener('click', () => {
    showVariation = !showVariation;
    
    if (showVariation) {
      newVariationBtn.textContent = "Amagar variació";
      newVariationBtn.classList.add('active');
    } else {
      newVariationBtn.textContent = "Veure variació";
      newVariationBtn.classList.remove('active');
    }
    
    renderCurrentView();
  });
}

// Calcular variació entre anys
function calculateVariation(profileData) {
  const years = profileData.years;
  const variations = {};
  
  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i - 1];
    const currentValue = profileData.data[currentYear] || 0;
    const previousValue = profileData.data[previousYear] || 0;
    const variation = currentValue - previousValue;
    
    variations[currentYear] = variation;
  }
  
  return variations;
}

// Mostrar/amagar botó de variació
function updateVariationButtonVisibility() {
  const variationArea = document.getElementById("variation-area");
  
  if (variationArea) {
    if (savedProfiles.length > 0) {
      variationArea.style.display = 'flex';
    } else {
      variationArea.style.display = 'none';
      showVariation = false;
      const variationBtn = document.getElementById("variation-btn");
      if (variationBtn) {
        variationBtn.textContent = "Veure variació";
        variationBtn.classList.remove('active');
      }
    }
  }
}

// Inicialització
async function init() {
  console.log("=== INICIANT APLICACIÓ ===");
  
  // Mostrar indicador de càrrega
  const container = document.querySelector('.container');
  container.innerHTML = '<div class="loading">🔄 Carregant dades...</div>';
  
  try {
    currentData = await loadCSV();
    
    if (currentData.length === 0) {
      container.innerHTML = '<div class="error">❌ No s\'han pogut carregar les dades.<br>Verifica que l\'arxiu CSV estigui disponible.</div>';
      return;
    }
    
    console.log("✅ Dades carregades exitosament:", currentData.length, "registres");
    console.log("📊 Anys disponibles:", [...new Set(currentData.map(d => d.Any))].sort());
    console.log("👥 Sexes disponibles:", [...new Set(currentData.map(d => d.Sexe))]);
    console.log("🎓 Estudis disponibles:", [...new Set(currentData.map(d => d.Estudis))]);
    console.log("🏛️ Territoris disponibles:", [...new Set(currentData.map(d => d.Territoris))]);
    
    // Restaurar el HTML original amb l'estructura corregida
    container.innerHTML = `
      <h2>Evolució del Malestar Emocional per Anys</h2>

      <!-- Botons de selecció de vista -->
      <div class="view-selector">
        <button class="view-btn active" id="eixos-btn">Per eixos de desigualtat</button>
        <button class="view-btn" id="perfils-btn">Comparar perfils</button>
      </div>

      <!-- Filtres principals - TOTS EN UNA FILA -->
      <div id="filters" class="filters-all-inline">
        <div class="filter-group">
          <label for="Sexe">Sexe:</label>
          <select id="Sexe">
            <option value="Tots">Carregant...</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="Edat">Edat:</label>
          <select id="Edat">
            <option value="Tots">Carregant...</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="Classe_social">Classe Social:</label>
          <select id="Classe_social">
            <option value="Tots">Carregant...</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="Estudis">Estudis:</label>
          <select id="Estudis">
            <option value="Tots">Carregant...</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="Territoris">Territori:</label>
          <select id="Territoris">
            <option value="Tots">Carregant...</option>
          </select>
        </div>
      </div>

      <!-- Secció perfils -->
      <div id="add-profile-section" style="display: none;">
        <div class="profile-controls-container">
          <!-- Botó afegir perfil -->
          <div class="add-profile-area">
            <button id="add-profile-btn" class="add-profile-btn">Afegir al gràfic</button>
            <span id="profile-counter" class="profile-counter">0/3 perfils afegits</span>
          </div>
          
          <!-- Botó variació (apareix quan hi ha perfils) -->
          <div class="variation-area" id="variation-area" style="display: none;">
            <button id="variation-btn" class="variation-btn">Veure variació</button>
            <span class="variation-help">Mostra canvis entre anys en punts percentuals</span>
          </div>
          
          <!-- Llista de perfils -->
          <div id="profile-list" class="profile-pills-container"></div>
        </div>
      </div>

      <!-- Pestanyes per eixos de desigualtat -->
      <div id="inequality-tabs" class="inequality-tabs">
        <button class="inequality-tab active" data-variable="Edat">Edat</button>
        <button class="inequality-tab" data-variable="Classe_social">Classe Social</button>
        <button class="inequality-tab" data-variable="Estudis">Estudis</button>
        <button class="inequality-tab" data-variable="Territoris">Territori</button>
      </div>

      <div class="histogram-legend" id="histogram-legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #6b6664;"></div>
          <span>Dades Generals</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #20484c;"></div>
          <span>Homes</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #4b1d03;"></div>
          <span>Dones</span>
        </div>
      </div>

      <div class="histogram-container">
        <div class="loading">📊 Processant dades de l'histograma...</div>
      </div>

      <div class="tooltip" id="tooltip"></div>
    `;
   
   // Processar dades pas a pas
   setTimeout(() => {
     console.log("🔧 Poblant filtres...");
     populateFilters(currentData);
     
     // Inicialitzar noves funcionalitats
     initializeViews();
     initializeInequalityTabs();
     
     setTimeout(() => {
       // Agregar el SVG després de poblar filtres
       const histogramContainer = document.querySelector('.histogram-container');
       histogramContainer.innerHTML = '<svg id="histogram" width="800" height="400"></svg>';
       
       console.log("📊 Renderitzant vista inicial...");
       renderCurrentView();
       console.log("🎉 Aplicació iniciada correctament");
     }, 200);
   }, 100);
   
 } catch (error) {
   console.error("💥 Error durant la inicialització:", error);
   container.innerHTML = `<div class="error">❌ Error en carregar l'aplicació:<br>${error.message}</div>`;
 }
}

// Fer removeProfile global
window.removeProfile = removeProfile;
// Iniciar quan el DOM estigui llest
document.addEventListener('DOMContentLoaded', init);