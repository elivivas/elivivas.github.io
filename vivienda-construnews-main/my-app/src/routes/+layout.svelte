<script lang="ts">
  import Footer from '$lib/components/layout/Footer.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import '../lib/styles/global.css'; 
  let { children } = $props();

  const siteName = "Construnews";
  const title = "La carrera vertical: ¿Está España preparada para la vivienda industrializada?";
  const description = "Descubre por qué la construcción industrializada es la solución al déficit de vivienda en España. Análisis exhaustivo de licitaciones VPO, escasez de mano de obra y coste de materiales.";
  const url = "https://construnews.com/reportajes/carrera-vertical-vivienda-industrializada"; 
  const image = ""; 
  const authors = [
    "Carlos Albaladejo", 
    "Sandra Becker", 
    "Jorge Marzo", 
    "Eli Vivas", 
    "Xavier Jiménez"
  ];
  const publishDate = "2026-03-23T09:00:00+01:00";
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "headline": title,
    "image": [image],
    "datePublished": publishDate,
    "dateModified": publishDate,
    "author": authors.map(name => ({
      "@type": "Person",
      "name": name
    })),
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": "https://construnews.com/construnews-logo.png"
      }
    },
    "description": description
  };
</script>

<svelte:head>
  <title>{title} | {siteName}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <link rel="icon" href="https://construnews.com/wp-content/uploads/2025/02/faviconstru.png" />
  <meta name="author" content={authors.join(', ')} />
  
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

  <meta property="og:site_name" content={siteName} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="article:published_time" content={publishDate} />
  {#each authors as authorName}
    <meta property="article:author" content={authorName} />
  {/each}
  <meta property="article:section" content="Reportajes de datos" />
  <meta property="article:tag" content="Construcción industrializada" />
  <meta property="article:tag" content="Vivienda España" />
  <meta property="article:tag" content="VPO" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@Construnews" /> <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />

  {@html `<script type="application/ld+json">${JSON.stringify(schemaOrg)}</script>`}
</svelte:head>

<div class="app-wrapper">
  <Header/>
  <main>
    {@render children()} 
  </main>
  <Footer/>
</div>