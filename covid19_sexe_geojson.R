library(rgdal)
library(tidyverse)
library(rvest)

# dades espacials
munismapa <- rgdal::readOGR("https://analisi.transparenciacatalunya.cat/api/geospatial/97qg-zvqd?method=export&format=GeoJSON")

# dades covid
muniscovid <- read.csv('https://analisi.transparenciacatalunya.cat/api/views/jj6z-iyrp/rows.csv?accessType=DOWNLOAD&sorting=true')
muniscovid <- muniscovid %>% 
  group_by(MunicipiCodi,MunicipiDescripcio,SexeDescripcio, ResultatCovidDescripcio) %>% 
  dplyr::summarise(NumCasos = sum(NumCasos)) %>% 
  ungroup() %>% 
  filter(!is.na(MunicipiCodi)) %>% # treiem 'Altres municipis'
  filter(!is.na(NumCasos)) %>% # Sant Salvador està repetit sense valors WTF dades oficials
  mutate(sexe_descripcio = paste0(SexeDescripcio,'_',ResultatCovidDescripcio)) %>% 
  select(-SexeDescripcio,
         -ResultatCovidDescripcio) %>% 
  spread(key = sexe_descripcio, value = NumCasos) %>% 
  mutate(negatiu = Dona_Negatiu + Home_Negatiu,
         positiu = Dona_Positiu + Home_Positiu,
         testos = negatiu + positiu,
         Dona_testos = Dona_Negatiu + Dona_Positiu,
         Home_testos = Home_Negatiu + Home_Positiu)

# dades població
munispob <- read.csv2('MEGA/scripts/covid19/mapacritic/t1181mun.csv') %>% 
  mutate(Dones = Dones..De.0.a.14.anys + Dones..De.15.a.64.anys + Dones..De.65.anys.i.més,
         Homes = Homes..De.0.a.14.anys + Homes..De.15.a.64.anys + Homes..De.65.anys.i.més,
         Poblacio = Dones + Homes) %>% 
  select(Codi, Poblacio, Homes, Dones)



# merge
munismapa@data$codiine_num <- as.numeric(as.character(munismapa@data$codiine))
munismapa@data$municipi_num <- as.numeric(as.character(munismapa@data$municipi))
munismapa@data <- left_join(munismapa@data, munispob, by = c('municipi_num'='Codi'))
munismapa@data <- left_join(munismapa@data, muniscovid, by = c('codiine_num'='MunicipiCodi'))

# relatiu per 100.000 hab
munismapa@data$Dona_Negatiu_100hab <- round((munismapa@data$Dona_Negatiu*100000) / munismapa@data$Dones,2)
munismapa@data$Dona_Positiu_100hab <- round((munismapa@data$Dona_Positiu*100000) / munismapa@data$Dones,2)
munismapa@data$Home_Negatiu_100hab <- round((munismapa@data$Home_Negatiu*100000) / munismapa@data$Homes,2)
munismapa@data$Home_Positiu_100hab <- round((munismapa@data$Home_Positiu*100000) / munismapa@data$Homes,2)
munismapa@data$negatiu_100hab <- round((munismapa@data$negatiu*100000) / munismapa@data$Poblacio,2)
munismapa@data$positiu_100hab <- round((munismapa@data$positiu*100000) / munismapa@data$Poblacio,2)
munismapa@data$testos_100hab <- round((munismapa@data$testos*100000) / munismapa@data$Poblacio,2)
munismapa@data$Dona_testos_100hab <- round((munismapa@data$Dona_testos*100000) / munismapa@data$Dones,2)
munismapa@data$Home_testos_100hab <- round((munismapa@data$Home_testos*100000) / munismapa@data$Homes,2)

munismapa@data[is.na(munismapa@data)] <- 0

writeOGR(munismapa, "/mnt/linux_data/MEGA/scripts/covid19/mapacritic/Covid19_municipis_last.geojson", layer="covid", driver="GeoJSON",overwrite_layer = TRUE)

## pujar les dades al cartodb
# curl -v -F file=@/mnt/linux_data/MEGA/scripts/covid19/mapacritic/Covid19_municipis_last.geojson "https://critic.carto.com/api/v1/imports/?api_key=4bff808d2c7587bc027cca9395ced84f38ea92d0&collision_strategy=overwrite"