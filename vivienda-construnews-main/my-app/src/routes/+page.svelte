<script lang="ts">
  import ScrollyLineChart from "$lib/components/organisms/ScrollyLineChart.svelte";
  import ScrollyIntro from "$lib/components/organisms/ScrollyIntro.svelte";
  import Licitaciones from "$lib/components/organisms/Licitaciones.svelte";
  import { onMount } from "svelte";
  import LazyRender from "$lib/components/organisms/LazyRender.svelte";
  import GraficIlustrator from "$lib/components/organisms/GraficIlustrator.svelte";
  let datosGlobales: any[] = [];

  onMount(async () => {
    const res = await fetch("/datos/test.json");
    datosGlobales = await res.json();
  });
</script>

<header class="container">
  <h1>
    La carrera vertical: ¿está España preparada para la vivienda industrializada?
  </h1>
</header>

<main>
  <section class="container">
    <div class="content-block">
      <p>
        "Se calcula que en España faltan unas 170.000 viviendas al año", alerta 
        <a href="https://construnews.com/construccion/ignasi-perez-arnal-la-construccion-ha-quedado-al-margen-de-todas-las-revoluciones-industriales-y-eso-explica-su-crisis-estructural/">Ignasi Pérez, director de contenidos del Congreso Nacional de
        Arquitectura Avanzada y Construcción 4.0 de REBUILD</a>.
        El problema de la vivienda es una de las principales preocupaciones de los españoles y 
        uno de los puntos más críticos radica en su déficit.
      </p>
      <p>
        Esta situación <strong>traspasa las fronteras nacionales</strong>. Según el experto, Francia necesita 
        225.000 viviendas, Reino Unido ha aprobado planes para 300.000 anuales e Italia supera 
        las 200.000. Este déficit generalizado explica en parte el encarecimiento del alquiler y 
        la compra en toda la región.
      </p>
      <p>
        El boom inmobiliario de los 90 alcanzó su pico en 2006 con 600.000 viviendas libres 
        construidas. La crisis de 2008 lo derrumbó hasta menos de 50.000 (2013-2015), y la 
        recuperación posterior no ha logrado duplicar esa cifra. Las viviendas de protección 
        oficial (VPO) sufrieron un golpe aún mayor: de ~50.000 anuales en 2013 a menos de 1.500 en 2024.
        La construcción industrializada de vivienda social es residual: <strong>representa menos del 0,5% de las licitaciones 
        y ni siquiera el 0,7% de las empresas que han hecho VPO la utilizan</strong>. 
      </p>
      <article class="chart">
        <ScrollyLineChart />
      </article>
      <p>
        Pérez sugiere una posible solución que podría desacelerar la escalada de precios e, 
        incluso, remitirla: “La <strong>construcción industrializada</strong> puede ser ese nuevo sistema 
        necesario para afrontar la magnitud del reto”. ¿En qué consiste y cómo puede ayudar a 
        afrontar esta crisis?
      </p>
      <div class="quote">
        “La construcción industrializada puede ser ese nuevo sistema necesario
        para afrontar la magnitud del reto”<br />
        <p>— Ignasi Pérez | REBUILD</p>
      </div>
      <p>
        <a href="https://construnews.com/construccion/vanesa-alvarez-vara-la-industrializacion-esta-en-plena-ebullicion-y-sera-clave-para-responder-a-la-demanda-de-vivienda/">Vanesa Álvarez, Kam Modular Building en Sika,</a> lo define así: “La industrialización del sector de la construcción 
        y la arquitectura consiste en (...) cambiar el paradigma utilizando un sistema 
        constructivo basado en la <strong>innovación, sostenibilidad y digitalización</strong>”. Por tanto, 
        indica, podría “servir de herramienta para conseguir los objetivos tanto desde el punto 
        de vista social —necesidad de viviendas— como de sostenibilidad —descarbonización en 2050—”.
      </p>
      <article class="chart">
        <ScrollyIntro />
      </article>
      <p>
        El número de hogares ha crecido desde 2014 a un ritmo superior al de viviendas libres terminadas. 
        En 2021 hubo un cambio de inversión en VPO, y desde entonces, se invierte en vivienda pública 
        en mayor medida, pero insuficiente. 
      </p>
      <p>
        La necesidad de hogares se dispara por el crecimiento demográfico. La población de España 
        se situó en 49,6 millones de habitantes en enero de 2026, el valor máximo en la historia y 
        ha superado por primera vez los 10 millones de habitantes nacidos en el extranjero, 
        según datos de la <a
          href="https://www.ine.es/dyngs/Prensa/ECP4T25.htm"
        >
          Estadística de Población Continua del INE.</a
        >
      </p>
    </div>
  </section>
  <section class="container">
    <div class="icon-container">
        <img
          src="/images/casa-iso-_1.webp"
          alt="proceso-casa-1"
          class="img-casa"
          width="400" height="400"
        />
        <h2 class="versalitas">Planta -1</h2>
      </div>
      <h2>La licitación de VPO, bloqueada antes de empezar</h2>
      <p>
        Una de las causas de la falta de vivienda, dicen expertos del sector inmobiliario, es la 
        falta de suelo urbanizable. Y esto solo está en manos de las administraciones públicas. 
        ¿Están las administraciones invirtiendo lo suficiente para resolver el problema de la 
        escasez de vivienda?
      </p>
      <p>
        A falta de transparencia de datos sobre la obra privada, los datos de contratación pública 
        arrojan algo de luz. Las licitaciones de vivienda pública en España presentan 
        una situación difícil. De las licitaciones publicadas analizadas en la Plataforma de 
        Contratación del Sector Público -no incluye todas la CCAA-, <strong>un 20% quedaron desiertas</strong> en los útlimos 11 años. 
        Desde 2018 se ha experimentado una creciente inversión en VPO, de menos de 70 millones de euros en 2018 a más de 340, 
        entre aquellas licitaciones formalizadas y adjudicadas. En 2025, aunque representan un 
        porcentaje pequeño, aquellas que quedaron desiertas representaron una parte superior 
        a los años anteriores en cuanto a inversión.
      </p>
      <p>
        Las licitaciones que se llevan a cabo en el País Vasco no están incluidas en el conjunto 
        de España, al igual que las de Cataluña. En el caso de la comunidad euskera, según el portal 
        de datos del Gobierno Vasco, desde 2016 ha habido 28 licitaciones para trabajos de 
        construcción de viviendas. El coste va desde los 12.000 euros hasta los 15 
        millones de euros.
      </p>
  </section>
  <Licitaciones data={datosGlobales} />
  <section class="container">
    <div style="margin-top:10%">
      <article class="chart">
        <LazyRender height="60svh">
          {#await import("$lib/components/organisms/SuperNova.svelte") then {default: SuperNova}}
            <SuperNova data={datosGlobales}/>
          {/await}
        </LazyRender>
        <div class="notes">
          Fuente: Datos del portal de Hacienda filtrados para incluir únicamente
          licitaciones resueltas relacionadas con la construcción de vivienda de
          protección oficial y/o de promoción pública, 
          filtradas por duración (faltan menos del 3% de los registros). Para
          obtener los registros de construcción de VPO se ha filtrado por el
          código CPV de cada una, siempre que empezaran por 4521, disponible
          <a
            href="https://www.hacienda.gob.es/es-ES/GobiernoAbierto/Datos%20Abiertos/Paginas/licitaciones_plataforma_contratacion.aspx"
            >en su página web
          </a>. 
          Los datos para Cataluña se han obtenido de su
          <a
            href="https://analisi.transparenciacatalunya.cat/Economia/Contractaci-p-blica-a-Catalunya-publicacions-a-la-/ybgg-dgi6"
            >portal de contratación pública.
          </a>
        </div>
      </article>
    </div>
    <p>
      “La administración busca certidumbre”, sentencia Pérez Arnal. “Si anuncia que se entregarán 16 viviendas 
      en una fecha concreta, esa fecha debe cumplirse. <strong>Con la construcción tradicional hemos visto 
      reiteradamente que los plazos no se cumplen</strong>”.
    </p>
    <div class="quote">
        “La construcción industrializada aporta previsibilidad en plazos y costes. 
        En el mundo industrial, cuando compras un producto sabes cuándo te lo entregan. 
        Esa lógica hay que trasladarla a la vivienda social”<br />
        <p>— Ignasi Pérez | REBUILD</p>
    </div>
    <p>
      Las licitaciones analizadas presentan una duración de contrato de escasas semanas 
      (rehabilitaciones), ejecuciones de construcción que van de meses a años, o de hasta 75 años, 
      cuando se trata de contratos de transmisión y gestión de la vivienda protegida. 
      El 20% terminan desiertas debido a que a las promotoras les puede no resultar rentable 
      el desembolso inicial respecto al beneficio posterior. Los abandonos vienen <strong>motivados 
      además por problemas burocráticos de los propios organismos convocantes</strong>, como <a href="https://contractaciopublica.cat/ca/detall-publicacio/9f38de21-3a9c-1591-e832-f412736756e1/80101361">en la Marina 
      del Prat Vermell, en Barcelona,</a> donde el Institut Municipal de l'Habitatge i Rehabilitació 
      de Barcelona tuvo que retrasar la tramitación en 2021 debido a que no disponían en ese momento 
      del solar de la adjudicación; o en Almería, donde el propio Pleno Municipal <strong>retiró la autorización 
      para concertar el préstamos hipotecario</strong> a la empresa municipal Almería XXI de <a href="https://contrataciondelestado.es/wps/portal/plataforma/buscadores/detalle/!ut/p/z1/jVDLcoJAEPwajrrDwwVyQ3lHIwZB2QuFAXGrYLFgJb-fxXhMYubWM909PYMIOiLCipHWBacdKxqBM4JzzdmuVq6vgBGrNihrO0mwP0EFpejwjELEGH4pC4Se3CkLdaWlYRrhOPAAAt-114m8AE_BD8IfHpnIoOdW6uyswFRhu3wXGcJos488RQbAKGFd34p74smLls7YoEzXMCiyiPiQex4E8tIDTX59swFHuhM6u_204Yk8RKRuutP3uyx2Uo0akb46V33Vz2-9aF84vw4vEkgw0pFWrCxmHx0beH9j1ecwqwwozHJeU94UpzntJPjJ6dINHB3_ZYCurWsGs6zNN_tzezCGL4RGGSw!/dz/d5/L2dBISEvZ0FBIS9nQSEh/">16 viviendas unifamiliares 
      protegidas.</a>   
    </p>
    <p>
      Por lo que respecta al precio de la obra, el rango de coste va desde escasos cientos de euros 
      -en caso de rehabilitación- hasta más de 40 millones de euros, en el caso de licitaciones 
      para construcciones de edificios plurifamiliares de protección oficial.
    </p>
    <article class="chart">
      <h3 class="title-txt">
        ¿Quién construye la vivienda pública?
      </h3>
      <p class="subtitle">
        Ranking de empresas por promedio adjudicado en licitaciones públicas resueltas, 2015-2026
      </p>
      <LazyRender height="50svh">
        {#await import("$lib/components/organisms/RankingPromotoras.svelte") then {default: RankingPromotoras}}
          <RankingPromotoras data={datosGlobales}/>
        {/await}
      </LazyRender>
      <div class="notes">
          Fuente: Datos del portal de Hacienda filtrados para incluir únicamente
          licitaciones resueltas relacionadas con la construcción de vivienda de
          protección oficial y/o de promoción pública, 
          filtradas por duración (faltan menos del 3% de los registros). Para
          obtener los registros de construcción de VPO se ha filtrado por el
          código CPV de cada una, siempre que empezaran por 4521, disponible
          <a
            href="https://www.hacienda.gob.es/es-ES/GobiernoAbierto/Datos%20Abiertos/Paginas/licitaciones_plataforma_contratacion.aspx"
            >en su página web
          </a>. 
          Los datos para Cataluña se han obtenido de su
          <a
            href="https://analisi.transparenciacatalunya.cat/Economia/Contractaci-p-blica-a-Catalunya-publicacions-a-la-/ybgg-dgi6"
            >portal de contratación pública.
          </a>
        </div>
    </article>
    <p>
      Tres de cada diez licitaciones otorgadas en España en los últimos 11 años se dan en Barcelona y Valladolid. 
      La construcción industrializada de vivienda social es residual: <strong>representa menos del 0,5% de las licitaciones 
      y ni siquiera el 0,7% de las empresas que han hecho VPO la utilizan</strong>. De las seis licitaciones que usan métodos industrializados,
      dos son en Barcelona, dos en Valladolid, una en Valéncia y otra en Gironella.
    </p>
    <article class="chart">
      <h3 class="title-txt">
        Tres de cada diez licitaciones se dan en Barcelona y Valladolid
      </h3>
      <p class="subtitle">
        Distribución geográfica de los contratos, 2015-2026
      </p>
      <LazyRender height="60svh">
        {#await import("$lib/components/organisms/Beeswarm.svelte") then {default: Beeswarm}}
          <Beeswarm data={datosGlobales}/>
        {/await}
      </LazyRender>
      <div class="notes">
          Fuente: Datos del portal de Hacienda filtrados para incluir únicamente
          licitaciones resueltas relacionadas con la construcción de vivienda de
          protección oficial y/o de promoción pública, 
          filtradas por duración (faltan menos del 3% de los registros). Para
          obtener los registros de construcción de VPO se ha filtrado por el
          código CPV de cada una, siempre que empezaran por 4521, disponible
          <a
            href="https://www.hacienda.gob.es/es-ES/GobiernoAbierto/Datos%20Abiertos/Paginas/licitaciones_plataforma_contratacion.aspx"
            >en su página web
          </a>. 
          Los datos para Cataluña se han obtenido de su
          <a
            href="https://analisi.transparenciacatalunya.cat/Economia/Contractaci-p-blica-a-Catalunya-publicacions-a-la-/ybgg-dgi6"
            >portal de contratación pública.
          </a>
        </div>
    </article>
    <article class="chart">
      <h3 class="title-txt">
        ¿Se construye VPO en tu ciudad?
      </h3>
      <p class="subtitle">
        Ranking de empresas por promedio adjudicado en licitaciones públicas resueltas, 2015-2026
      </p>
      <LazyRender height="60svh">
        {#await import("$lib/components/organisms/RankingCiudades.svelte") then {default: RankingCiudades}}
          <RankingCiudades data={datosGlobales}/>
        {/await}
      </LazyRender>
      <div class="notes">
          Fuente: Datos del portal de Hacienda filtrados para incluir únicamente
          licitaciones resueltas relacionadas con la construcción de vivienda de
          protección oficial y/o de promoción pública, 
          filtradas por duración (faltan menos del 3% de los registros). Para
          obtener los registros de construcción de VPO se ha filtrado por el
          código CPV de cada una, siempre que empezaran por 4521, disponible
          <a
            href="https://www.hacienda.gob.es/es-ES/GobiernoAbierto/Datos%20Abiertos/Paginas/licitaciones_plataforma_contratacion.aspx"
            >en su página web
          </a>. 
          Los datos para Cataluña se han obtenido de su
          <a
            href="https://analisi.transparenciacatalunya.cat/Economia/Contractaci-p-blica-a-Catalunya-publicacions-a-la-/ybgg-dgi6"
            >portal de contratación pública.
          </a>
        </div>
    </article>
  </section>
  <section class="container">
    <div class="icon-container">
      <img
        src="/images/casa-iso-0.webp"
        alt="proceso-casa-2"
        class="img-casa"
        width="400" height="400"
      />
      <h2 class="versalitas">Planta 0</h2>
    </div>
    <h2>La estructura (industrialización vs. tradicional)</h2>
    <h3>La industria, solución a la falta de mano de obra</h3>
    <p>
      La construcción tradicional arrastra dos frenos: el encarecimiento de los materiales y 
      la escasez de mano de obra cualificada. "Necesitamos más tiempo y más recursos para hacer 
      menos que hace décadas", advierte Pérez, quien ve en la industrialización una respuesta 
      directa a esa presión laboral.
    </p>
    <p>
      Álvarez cifra el <strong>ahorro en tiempo entre el 30% y el 50%</strong> respecto a la construcción 
      convencional. Aunque la inversión inicial es mayor, el coste en mano de obra se reducirá 
      —augura la responsable de cuentas en España de la marca de materiales SIKA— en 
      un sector que perdió trabajadores tras 2008 y que hoy se apoya cada vez más en mano 
      de obra latinoamericana.
    </p>
    <div class="quote">
      “En construcción industrializada se pueden conseguir ahorros de tiempos de
      entre el 30 y el 50% respecto a la tradicional”<br />
      <p>— Vanesa Álvarez | SIKA</p>
    </div>
    <p>
      La planta industrializada ofrece mejores condiciones laborales a las de la obra tradicional: 
      horarios estables, entorno protegido, procesos optimizados y menor exposición física. 
      "La industrialización no sustituye a las personas", afirma García Fernández, CEO de 
      la empresa de baños industriales Modulacción. "Les da mejores herramientas 
      para trabajar mejor".
    </p>
    <article class="chart">
      <h3 class="title-txt">
        En los próximos años se jubilarán más de 127.000 hombres
      </h3>
      <p class="subtitle">
        Pirámide de edades del personal del sector de la construcción. 
      </p>
      <GraficIlustrator/>
      <div class="notes">
        Fuente: <a href="https://www.ine.es/jaxiT3/Tabla.htm?t=65992&L=0"
          >EPA | Ocupados por nacionalidad, sexo y sector económico. Media de
          los cuatro trimestres del año | INE</a
        >
      </div>
    </article>
    <p>
      Este tipo de beneficios van más allá de la productividad. La dureza tradicional del 
      sector ha alejado durante décadas a nuevas generaciones y a perfiles diversos. 
      La fábrica no elimina el esfuerzo, pero cambia el contexto —y abre la puerta a 
      una mayor incorporación femenina en un sector donde su presencia sigue siendo muy escasa.
    </p>
    <article class="chart">
      <h3 class="title-txt">
        Casi la mitad de los trabajadores extranjeros en el sector proceden de América Latina
      </h3>
      <p class="subtitle">
        Evolución de la nacionalidad en la construcción, 2008-2025. Datos en
        miles.
      </p>
      <LazyRender height="60svh">
        {#await import("$lib/components/organisms/AreaPerfiles.svelte") then {default: AreaPerfiles}}
          <AreaPerfiles />
        {/await}
      </LazyRender>
      <div class="notes">
        Fuente: <a href="https://www.ine.es/jaxiT3/Tabla.htm?t=65992&L=0"
          >EPA | Ocupados por nacionalidad, sexo y sector económico. Media de
          los cuatro trimestres del año | INE</a
        >
      </div>
    </article>
    <p>
      Si se mira la evolución según el país de nacimiento, el número de trabajadores extranjeros 
      con contrato indefinido casi se ha duplicado en dos años, mientras la suma 
      de trabajadores con contrato temporal ha vivido un decrecimiento en el mismo periodo.
    </p>
    <article class="chart">
      <h3 class="title-txt">
        Del contrato temporal al indefinido: el nuevo mapa del empleo extranjero
      </h3>
      <p class="subtitle">
        Evolución de la ocupación según origen y tipo de contrato, 2021-2023. En miles
      </p>
      <LazyRender height="70svh">
        {#await import("$lib/components/organisms/PaisNac.svelte") then {default: PaisNac}}
          <PaisNac />
        {/await}
      </LazyRender>
      <div class="notes">
        Fuente: <a href="https://www.ine.es/jaxiT3/Tabla.htm?t=69958&L=0"
          >Censo Anual de Población | Ocupados de 16 y más años por sexo, país
          de nacimiento, rama de actividad y situación profesional | INE</a
        >
      </div>
    </article>
  </section>
  <section class="container">
    <div class="icon-container">
      <img
        src="/images/casa-iso-1.webp"
        alt="proceso-casa-3"
        class="img-casa"
        width="400" height="400"
      />
      <h2 class="versalitas">Planta 1</h2>
    </div>
    <h2>Materiales más caros, pero más sostenibles</h2>
    <p>
      El coste de los materiales se ha disparado en las últimas dos décadas —el cobre, 
      los cables eléctricos y la fibra óptica han triplicado su precio desde 2005—. 
      La industrialización, sin embargo, minimiza el desperdicio gracias al control 
      de procesos, y permitirá reciclar más del 60% de los materiales, 
      reduciendo la huella de carbono, según Álvarez.
    </p>
    <p>
      El aluminio reutilizable es clave en este modelo. Tony Macián, director del grupo Alumed, 
      destaca que su sistema permite hormigonar muros y forjados simultáneamente, 
      reduciendo los tiempos de obra al menos un 30%.
    </p>
    <article class="chart">
      <h3 class="title-txt">
        El precio de los tubos de cobre y el cableado se triplica en las últimas dos décadas
      </h3>
      <p class="subtitle">
        Evolución del índice de materiales en la construcción, 2005-2024.
      </p>
      <LazyRender height="60svh">
        {#await import("$lib/components/organisms/TablaMateriales.svelte") then {default: TablaMateriales}}
          <TablaMateriales />
        {/await}
      </LazyRender>
      <div class="notes">
        Fuente: <a
          href="https://apps.fomento.gob.es/boletinonline/?nivel=2&orden=19000000"
          >Índices de producción de la industria de la construcción (CNAE 2009)
          | Ministerio de Fomento</a
        >
      </div>
    </article>
    <p>
      Otro de los materiales que están relacionados con la industrialización en
      la construcción son los <strong>prefabricados</strong>: su precio se ha encarecido la
      mitad, de un índice 82 en 2005 a 127 en 2024, con base en 2021. Los únicos
      materiales que se han abaratado en dos décadas son la electrónica y los
      porteros y antenas de megafonía.
    </p>
    <p>
      ¿Es la industrialización la solución tecnológica al problema artesanal? 
      La desmitificación de la casa prefabricada radica en que no se trata de una caseta, sino 
      que es un lego de precisión: “La precisión del sistema industrializado permite reducir 
      fases posteriores en acabados y ajustes”, defiende Macián. Para él, mientras que en 
      las obras tradicionales el albañil tiene que hacer las ventanas solo después de poner 
      los muros, en el sistema industrializado no hace falta esperar, es decir, que se pueden 
      comenzar las ventanas mientras se levantan los muros.
    </p>
    <div class="quote">
      “Con nuestro sistema, puedes hacer las ventanas a la vez que levantas los muros”<br />
      <p>— Tony Macián | GRUPO ALUMED</p>
    </div>
  </section>
  <section class="container">
    <div class="icon-container">
      <img
        src="/images/casa-iso-2.webp"
        alt="proceso-casa-4"
        class="img-casa"
        width="400" height="400"
      />
      <h2 class="versalitas">Ático</h2>
    </div>
    <p>La trazabilidad es otra de las señas de identidad de la construcción 
      industrializada. Cada módulo sale de fábrica con su propia historia 
      documentada: materiales, controles, responsables, fases e incidencias. 
      "Este baño tiene su propia identidad", ilustra <a href="https://construnews.com/construccion/pedro-garcia-fernandez-la-industrializacion-no-es-fabricar-mas-es-fabricar-mejor-y-con-metodo/">Pedro García Fernández, CEO de Modulaccion</a>, como un ejemplo de historia reconocida. Un contraste 
      claro con la obra tradicional, donde ese seguimiento suele quedar disperso 
      entre papeles y memoria de los equipos. En esa diferencia se perfila, 
      cada vez más, el modelo de construcción del futuro
    </p>
  </section>
</main>
