import { createSelector } from 'reselect';
import {
  isCountryMode,
  getCurrentCountry,
  getSupplyUnits,
  getSupplyUnitsGeoms,
  defaultFilters,
  getMapListDimension,
  getCountriesWithGeoms,
  getCountriesWithVolume,
  getCurrentVolumeBucketConfig,
  getCurrentHighlightedBucket,
  computeAllSupplyUnitsResolvedScoreBuckets,
  computeAllSupplyUnitsResolvedVolumeBuckets,
  getCurrentHighlightedSupplyUnit,
} from '../app/selectors';
import { resolveBuckets } from '../app/filters';
import { maxBy } from 'lodash';
import { getBucketByDimension } from './MapUtils';
import { matchesWithHighlightedBuckets } from '../utils';


const COUNTRIES_ID_LABELS = {
  Guatemala: 'guatemala',
  Nicaragua: 'nicaragua',
  'Costa Rica': 'costa_rica'
};


export const attachCountriesBuckets = createSelector(
  [
    getCountriesWithGeoms,
    getCountriesWithVolume,
    getCurrentVolumeBucketConfig,
    getCurrentHighlightedBucket,
    isCountryMode
  ],
  (countries, countriesVolumes, volumeBucketConfig, highlightedBucket, countryMode) => {
    const maxVolume = maxBy(countriesVolumes, 'volume').volume;
    const buckets = resolveBuckets(countriesVolumes, volumeBucketConfig, maxVolume, 'volume');
    return countries.map(country => {
      const bucket = buckets.find(c => c.id === country.id);
      const bucketIndexes = {
        volume: bucket.bucketIndex,
        score: null
      };
      let isHighlighted = false;
      let bucketDimension = getBucketByDimension({}, bucket, 'volume');
      let color;
      if (!countryMode && highlightedBucket !== null) {
        isHighlighted = matchesWithHighlightedBuckets('volume', highlightedBucket, bucketIndexes);
        color = isHighlighted ? bucket.color : '#F2F5F4';
      }
      return {
        ...country,
        bucket: {
          ...bucket,
          ...bucketDimension,
          color: color || bucketDimension.color
        }
      };
    });
  }
);

const getRandomSupplyUnits = createSelector(
  [getCurrentCountry, getSupplyUnits, getSupplyUnitsGeoms],
  (currentCountry, supplyUnits, supplyUnitsGeom) => {
    if (currentCountry === defaultFilters.country) {
      return [];
    }
    const countrySUs = supplyUnits.filter(su => su.country === currentCountry);
    const countryLabel = Object.keys(COUNTRIES_ID_LABELS).find(k => COUNTRIES_ID_LABELS[k] === currentCountry);
    const countrySUGeoms = supplyUnitsGeom.filter(sug => sug.properties.LEVEL0 === countryLabel);
    return countrySUGeoms.map(supplyUnitGeom => {
      if (!countrySUs.length) {
        // fallback mechanism to be able at least to retrieve country
        return {
          ...supplyUnitGeom,
          country: COUNTRIES_ID_LABELS[supplyUnitGeom.properties.LEVEL0],
          key: '' + Date.now() + Math.random(),
          id: supplyUnitGeom.properties.ID
        };
      }
      const index = Math.floor(Math.random() * countrySUs.length);
      const supplyUnit = countrySUs.splice(index, 1)[0];
      return {
        ...supplyUnitGeom,
        ...supplyUnit,
        key: '' + Date.now() + Math.random(),
        id: supplyUnitGeom.properties.ID,
        supplyUnitId: supplyUnit.id
      };
    });
  }
);

export const attachSupplyUnitBuckets = createSelector(
  [
    /*getSupplyUnitsWithGeoms, */ getRandomSupplyUnits,
    computeAllSupplyUnitsResolvedScoreBuckets,
    computeAllSupplyUnitsResolvedVolumeBuckets,
    getMapListDimension,
    getCurrentHighlightedBucket,
    getCurrentHighlightedSupplyUnit,
  ],
  (supplyUnits, scoreBuckets, volumeBuckets, mapDimension, highlightedBucket, highligtedSupplyUnit) => {
    return supplyUnits.map(supplyUnit => {
      const scoreSU = scoreBuckets.find(b => b.id === supplyUnit.supplyUnitId);
      const volumeSU = volumeBuckets.find(b => b.id === supplyUnit.supplyUnitId);
      if (scoreSU === undefined || volumeSU === undefined) {
        return supplyUnit;
      }
      const bucket = getBucketByDimension(scoreSU.bucket, volumeSU.bucket, mapDimension);
      const bucketIndexes = {
        score: scoreSU.bucket.bucketIndex,
        volume: volumeSU.bucket.bucketIndex
      };
      let isHighlighted = highlightedBucket !== null;
      let color;
      if (highlightedBucket !== null || highligtedSupplyUnit !== null) {
        isHighlighted = matchesWithHighlightedBuckets(mapDimension, highlightedBucket, bucketIndexes) ||
          supplyUnit.id === highligtedSupplyUnit || supplyUnit.supplyUnitId === highligtedSupplyUnit;
        color = isHighlighted ? bucket.color : '#F2F5F4';
      }
      return {
        bucketIndexes,
        bucket: {
          ...bucket,
          color: color || bucket.color
        },
        value: scoreSU.value,
        ...supplyUnit
      };
    });
  }
);

export const filterSupplyUnitsByCurrentCountry = createSelector(
  [getCurrentCountry, attachSupplyUnitBuckets],
  (currentCountry, supplyUnitsWithGeom) => {
    if (currentCountry === defaultFilters.country) {
      return [];
    }
    return supplyUnitsWithGeom.filter(sug => sug.country === currentCountry);
  }
);


// const tryMatchingSUByID = (geomProperties, supplyUnits) => {
//   // TODO fields available: ID, LEVEL2, SUPPLY_UNI: how to reconciliate ?
//   // This is throw-away code that tries to match data json ids with shapefiles ids
//   const supplyUnitGeomID = geomProperties.ID
//     .replace('__', '')
//     .toLowerCase()
//     // https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '');

//   const supplyUnit = supplyUnits.find(su => {
//     const suID = su.id
//       .replace('_', '')
//       .toLowerCase();
//     return supplyUnitGeomID.match( new RegExp(suID, 'gi')) !== null;
//   });
//   return {
//     supplyUnit,
//     id: supplyUnitGeomID
//   };
// };

// returns all SUs available in geometries and attach SU data from store
// TODO: this just doesn't work with the currently available shapefile
// const getSupplyUnitsWithGeoms = createSelector(
//   [getSupplyUnits, getSupplyUnitsGeoms],
//   (supplyUnits, supplyUnitsGeom) => {
//     return supplyUnitsGeom.map(supplyUnitGeom => {
//       const supplyUnit = supplyUnits.find(su => su.id === supplyUnitGeom.properties.ID);

//       return {
//         ...supplyUnitGeom,
//         ...supplyUnit
//       };
//     });
//   }
// );
