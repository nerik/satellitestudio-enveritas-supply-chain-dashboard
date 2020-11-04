#!/usr/bin/env node

// generates three topojson files:
// - supply units polygons from a an input shapefile
// - country polygons based on supply units shapes
// - country polygons based on a Natural Earth shapefiules,
// for countries where supply units are not available


const { execSync } = require('child_process');
const { readFileSync } = require('fs');

// npm run generate-topojson ./scripts/in/su/su\ of\ central\ america.shp ./scripts/in/ne/ne_10m_admin_0_countries.shp
const sourceSUPath = process.argv[2];
const sourceCountriesPath = process.argv[3];
console.log('input paths:\n', sourceSUPath, '\n', sourceCountriesPath);

const SIMPLIFY = '-simplify visvalingam 0.1';
const ENCODING = 'encoding=utf-8';

// load countries that have SUs from existing dataset 
const ALL_COUNTRIES = ['Guatemala', 'Nicaragua', 'Costa Rica', 'Mexico', 'Belize', 'El Salvador', 'Panama','Colombia', 'Honduras'];
const DATA_PATH = './src/data/supplychain-dataset.json';
const suCountries = JSON.parse(readFileSync(DATA_PATH)).countries.map(c => c.label);
console.log('countries with SUS:', suCountries);
const otherCountries = ALL_COUNTRIES.filter(c => !suCountries.includes(c));
console.log('countries without SUS:', otherCountries);


// Generates supply units topo json
const SU_PATH = './src/map/supplyUnit.topo.json';
const mapshaperSUCommand =
  `npx mapshaper name=supplyUnit "${sourceSUPath}" ${ENCODING} ${SIMPLIFY} -o ${SU_PATH} format=topojson`;
execSync(mapshaperSUCommand);

// Generate countries shapes. In order to have topologies matching supply units topologies, we'll
// - dissolve supply units into countries, using the country field (LEVEL0)
// - for countries of the region that don't have any supply unit, we'll take geometries from Natural Earth (excluding countries that DO have supply units)
const SUPPLY_UNIT_DISSOLVE_FIELD = 'LEVEL0';
const TMP_SU_COUNTRIES_PATH = './src/map/country.su.topo.json';
const mapshaperSUCountryCommand = 
  `npx mapshaper name=country "${sourceSUPath}" ${ENCODING} -dissolve ${SUPPLY_UNIT_DISSOLVE_FIELD} -rename-fields NAME=LEVEL0 ${SIMPLIFY} -o ${TMP_SU_COUNTRIES_PATH} format=topojson`;
console.log(mapshaperSUCountryCommand);
execSync(mapshaperSUCountryCommand);

// generate another topojson with the other countries, those that are not formed of SUs
const TMP_OTHER_COUNTRIES_PATH = './src/map/country.other.topo.json';
const mapshaperRegionCountryCommand = 
`mapshaper name=country ${sourceCountriesPath} -filter '"${otherCountries.join(',')}".indexOf(NAME) > -1' -filter-fields NAME -o ${TMP_OTHER_COUNTRIES_PATH} format=topojson`;
console.log(mapshaperRegionCountryCommand);
execSync(mapshaperRegionCountryCommand);