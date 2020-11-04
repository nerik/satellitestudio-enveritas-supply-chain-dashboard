import { createSelector } from 'reselect';
import { max, uniq, sumBy, groupBy, orderBy } from 'lodash';
import { MMR_ID } from '../constants';

import {
  collectTraitsForSupplyUnit,
  collectParcelsForSupplyUnit,
  computeScoresByStandard,
  computePillarScores,
  computeVolume,
  resolveSupplyUnitScores,
  resolveBucketConfig,
  resolveBuckets
} from './filters';

export const defaultFilters = {
  country: 'all',
  blend: 'all',
  pillar: 'all',
  supplier: 'all'
};

// ---- Input selectors ----------------------------------------------------------------------
// app state
export const getUrlQuery = (state) => state.location && state.location.query;
export const getCurrentFilters = (state) => ({ ...defaultFilters, ...state.location.query });
export const getCurrentCountry = (state) => getCurrentFilters(state).country;
export const getCurrentBlend = (state) => getCurrentFilters(state).blend;
export const getCurrentPillar = (state) => getCurrentFilters(state).pillar;
export const getCurrentHighlightedCountry = (state) => state.app.currentHighlightedCountry;
export const getCurrentHighlightedBucket = (state) => state.app.currentHighlightedBuckets;
export const getCurrentHighlightedLink = (state) => state.app.currentHighlightedLink;
export const getCurrentHighlightedSuppliers = (state) => state.app.currentHighlightedSuppliers;
export const getCurrentHighlightedSupplyUnit = (state) => state.app.currentHighlightedSupplyUnit;

//app data
export const getAvailableFilters = (state) => state.app.availableFilters;
export const getData = (state) => state.app.data;
export const getSupplyUnits = (state) => state.app.data.supplyUnits;
export const getSupplyUnitsGeoms = (state) => state.app.geoms.supplyUnits;
export const getSuppliers = (state) => state.app.data.suppliers;
export const getCountries = (state) => state.app.data.countries;
export const getCountriesGeoms = (state) => state.app.geoms.countries;
export const getTraits = (state) => state.app.data.traits;
export const getCriterias = (state) => state.app.data.criteria;
export const getFlagTraits = (state) => state.app.data.flagTraits;
export const getParcels = (state) => state.app.data.parcels;
export const getStandards = (state) => state.app.data.standards;
export const getVolumeBucketConfig = (state) => state.app.data.volumeBucketConfigs;
export const getScoreBucketConfig = (state) => state.app.data.scoreBucketConfigs;
export const getScoreWheelBucketConfig = (state) => state.app.data.scoreWheelBucketConfigs;

export const isCountryMode = createSelector(
  [getCurrentCountry],
  (currentCountry) => (currentCountry !== defaultFilters.country)
);

export const getSankeyOrderBy = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.sankeyOrderBy) || 'desc'
);

export const getSankeyPage = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && parseInt(query.sankeyPage, 10)) || 0
);

export const getSankeyDimension = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.sankeyDimension) || 'bivariate'
);

export const getMapListDimension = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.mapDimension) || 'bivariate'
);

export const getSupplierScoreOrder = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.supplierScoreOrder) || 'desc'
);

export const getSortScoresBy = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.sortScoresBy) || 'desc'
);

export const getDimensionMode = createSelector(
  [getUrlQuery],
  (query) => (query !== undefined && query.sankeyDimension) || 'bivariate'
);


// ---- Memoized selectors --------------------------------------------------------------------
export const collectSupplyUnitsForCurrentCountry = createSelector(
  [getCountries, getSupplyUnits, getCurrentCountry],
  (countries, supplyUnits, currentCountry) => {
    if (currentCountry === defaultFilters.country) {
      return supplyUnits;
    }
    const country = countries.find(c => c.id === currentCountry);
    const countrySupplyUnitsIDs = country.supplyUnits.map(csu => csu.id);
    return supplyUnits.filter(su => countrySupplyUnitsIDs.includes(su.id));
  }
);
export const collectSupplyUnitsForCurrentCountryAndBlend = createSelector(
  [collectSupplyUnitsForCurrentCountry, getCurrentBlend],
  (supplyUnits, currentBlend) => {
    if (currentBlend === defaultFilters.blend) return supplyUnits;
    return supplyUnits.filter(su => su.blendWeights[currentBlend] !== undefined);
  }
);

const collectSupplyUnitIDsForCurrentCountry = createSelector(
  [collectSupplyUnitsForCurrentCountryAndBlend],
  (countrySupplyUnits) => countrySupplyUnits.map(su => su.id)
);

export const getAvailableFiltersWithActive = createSelector(
  [getAvailableFilters, getCurrentFilters],
  (availableFilters, currentFilters) => {
    const keys = Object.keys(availableFilters);
    const newFilters = {};
    keys.forEach(key => {
      newFilters[key] = availableFilters[key].map(f => ({
        ...f,
        active: f.id === currentFilters[key]
      }));
    });
    return newFilters;
  }
);

export const getCurrentCountryData = createSelector(
  [getCurrentCountry, getCountries],
  (currentCountryId, countries) => countries.find(c => c.id === currentCountryId)
);

export const getIsCountrySelected = createSelector(
  [getCurrentCountry],
  (currentCountry) => currentCountry === defaultFilters.country
);

export const getStandardsByCurrentPillar = createSelector(
  [getCurrentPillar, getStandards],
  (pillar, standards) => {
    if (pillar === defaultFilters.pillar) return standards;
    return standards.filter(s => s.pillar === pillar);
  }
);

// Gets all traits for the current country
export const getTraitsByCurrentCountry = createSelector(
  [getTraits, collectSupplyUnitIDsForCurrentCountry],
  (traits, supplyUnitIDsForCountry) => {
    const traitsForCountry = traits.filter(trait =>
      supplyUnitIDsForCountry.includes(trait.supplyUnit.id)
    );
    return traitsForCountry;
  }
);

// Gets all traits for the current country and pillar selected
export const getTraitsByCurrentCountryAndPillar = createSelector(
  [getTraitsByCurrentCountry, getStandardsByCurrentPillar],
  (traits, standards) => {
    const traitsIdFiltered = standards.flatMap(s => s.criteria.map(c => c.id));
    const traitsForCountryAndPillar = traits.filter(trait =>
      traitsIdFiltered.includes(trait.criterion.id)
    );
    return traitsForCountryAndPillar;
  }
);

// Gets all traits for the current SU selected
const collectTraitsForCurrentSupplyUnit = createSelector(
  [getTraits, getCurrentHighlightedSupplyUnit],
  collectTraitsForSupplyUnit
);

const computeOverallScores = createSelector(
  [getStandards, getTraitsByCurrentCountry, getCurrentBlend],
  computeScoresByStandard
);

const resolveScoreWheelBucketConfigs = createSelector(
  [getScoreWheelBucketConfig, getCurrentCountry, getCurrentBlend, getCurrentPillar],
  resolveBucketConfig
);

const resolveOverallScoresBuckets = createSelector(
  [computeOverallScores, resolveScoreWheelBucketConfigs],
  resolveBuckets
);

export const resolveScoreBucketConfigs = createSelector(
  [getScoreBucketConfig, getCurrentCountry, getCurrentBlend, getCurrentPillar],
  resolveBucketConfig
);

export const resolveVolumeBucketConfigs = createSelector(
  [getVolumeBucketConfig, getCurrentCountry, getCurrentBlend, getCurrentPillar],
  resolveBucketConfig
);

const computeCurrentSupplyUnitScores = createSelector(
  [getStandards, collectTraitsForCurrentSupplyUnit, getCurrentBlend],
  computeScoresByStandard
);

export const resolveSupplyUnitScoresBuckets = createSelector(
  [computeCurrentSupplyUnitScores, resolveScoreWheelBucketConfigs],
  resolveBuckets
);

export const attachPillarScores = (type) => {
  return createSelector(
    [(type === 'overall') ? resolveOverallScoresBuckets : resolveSupplyUnitScoresBuckets],
    computePillarScores
  );
};

export const getCurrentScoreBucketConfig = createSelector(
  [getScoreBucketConfig, getCurrentCountry, getCurrentBlend, getCurrentPillar],
  resolveBucketConfig
);

export const computeSupplyUnitScoresForCurrentSelection = createSelector(
  [getStandardsByCurrentPillar, getTraitsByCurrentCountryAndPillar, collectSupplyUnitsForCurrentCountry, getCurrentBlend],
  resolveSupplyUnitScores
);

export const computeAllSupplyUnitScores = createSelector(
  [getStandards, getTraitsByCurrentCountryAndPillar, getSupplyUnits, getCurrentBlend],
  resolveSupplyUnitScores
);

export const computeAllSupplyUnitsResolvedScoreBuckets = createSelector(
  [computeSupplyUnitScoresForCurrentSelection, getCurrentScoreBucketConfig],
  (supplyUnits, scoreBucketConfig) => {
    const supplyUnitsBuckets = supplyUnits.map(supplyUnit => {
      let bucket;
      if (supplyUnit.value) {
        const supplyUnitScoreBuckets = resolveBuckets([{ value: supplyUnit.value }], scoreBucketConfig);
        bucket = supplyUnitScoreBuckets[0];
      } else {
        console.warn('Supply unit without score', supplyUnit);
      }
      return {
        ...supplyUnit,
        bucket
      };
    });

    // Temporary: normally all SUs should have values (currently all of shapefile SUs)
    return supplyUnitsBuckets.filter(supplyUnitScore => supplyUnitScore.bucket !== null && supplyUnitScore.bucket !== undefined);
  }
);

export const getCurrentVolumeBucketConfig = createSelector(
  [getVolumeBucketConfig, getCurrentCountry, getCurrentBlend, getCurrentPillar],
  resolveBucketConfig
);

export const computeAllSupplyUnitsResolvedVolumeBuckets = createSelector(
  [getStandards, getParcels, getCurrentVolumeBucketConfig, collectSupplyUnitIDsForCurrentCountry],
  (standards, allParcels, volumeBucketConfig, supplyUnitIDsForCountry) => {
    const supplyUnitVolumes = supplyUnitIDsForCountry.map(supplyUnitID => {
      const supplyUnitParcels = collectParcelsForSupplyUnit(allParcels, supplyUnitID);
      if (supplyUnitParcels.length) {
        return computeVolume(supplyUnitParcels);
      }
      return null;
    });
    const maxVolume = max(supplyUnitVolumes);
    const supplyUnitsVolumeBuckets = supplyUnitIDsForCountry.map((supplyUnitID, i) => {
      const supplyUnitVolume = supplyUnitVolumes[i];
      if (supplyUnitVolume !== null) {
        const values = [ { value: supplyUnitVolume } ];
        const supplyUnitVolumeBuckets = resolveBuckets(values, volumeBucketConfig, maxVolume );
        const bucket = supplyUnitVolumeBuckets[0];
        return {
          id: supplyUnitID,
          bucket
        };
      }
      return {
        id: supplyUnitID,
        bucket: null
      };
    });
    // Temporary: normally all SUs should have values (currently all of shapefile SUs)
    const supplyUnitsVolumeBucketsWithValues = supplyUnitsVolumeBuckets.filter(bucket => bucket.bucket !== null && bucket.bucket !== undefined);
    return supplyUnitsVolumeBucketsWithValues;
  }
);

// return criteria that are linked to MMRs
export const getMMRCriterias = createSelector([getCriterias],(criterias) =>
  criterias.filter(c => c.criterionFlags.map(cf => cf.id).includes(MMR_ID))
);

// filters a list of flagTraits to only return MMR includes in the current SUs
export const getCurrentMMRFlagTraits = createSelector(
  [getFlagTraits, collectSupplyUnitsForCurrentCountryAndBlend],
  (flagTraits, supplyUnits) => {
    const supplyUnitsIDs = supplyUnits.map(su => su.id);
    return flagTraits.filter(f => supplyUnitsIDs.includes(f.supplyUnit.id));
  }
);

// Return traits that have a criterion that is not linked to MMRs
export const getNotMMRTraits = createSelector(
  [getMMRCriterias, getTraitsByCurrentCountryAndPillar],
  (criterias, traits) => {
  const criteriasIDs = criterias.map(c => c.id);
  return traits.filter(t => !criteriasIDs.includes(t.criterion.id));
});

export const getParcelsByCountryAndBlend = createSelector(
  [getParcels, getCurrentBlend, getCurrentCountry],
  (parcels, blend, country) => {
    return parcels && parcels.filter(p => (
      (blend === defaultFilters.blend || p.blend.id === blend) &&
      (country === defaultFilters.country || p.country.id === country)
    ));
  }
);

export const computeParcelsVolume = createSelector(
  getParcelsByCountryAndBlend,
  (parcels) => sumBy(parcels, 'volume')
);

// computes volumes and scores for a selection of traits and parcels
export const getCurrentSuppliersWithScore = createSelector(
  [getParcelsByCountryAndBlend, getSuppliers, computeSupplyUnitScoresForCurrentSelection],
  (parcels, suppliers, supplyUnits) => {
    // collect all unique supplier ids from parcels
    const parcelSuppliersIDs = uniq(parcels.map(p => p.supplier.id));
    const suppliersWithScore = parcelSuppliersIDs.map(sid => {
      const supplierData = suppliers.find(su => su.id === sid);
      const supplierParcels = parcels.filter(p => p.supplier.id === sid);
      const supplierTotalVolume = sumBy(supplierParcels, 'volume');
      const supplierSupplyUnits = uniq(supplierParcels.map(p => p.supplyUnit.id));
      const supplierSupplyUnitsData = supplyUnits.filter(su => supplierSupplyUnits.includes(su.id));
      const parcelsGroupBySupplyUnits = groupBy(supplierParcels, 'supplyUnit.id');
      const parcelsWithValueAndVolume = Object.keys(parcelsGroupBySupplyUnits).map(k =>({
        value: supplierSupplyUnitsData.find(su => su.id === k).value,
        volume: sumBy(parcelsGroupBySupplyUnits[k], 'volume')
      }));
      const totalParcelsVolume = sumBy(parcelsWithValueAndVolume, 'volume');
      const supplierScore = parcelsWithValueAndVolume.reduce((acc, parcel) => acc + (parcel.value * parcel.volume) / totalParcelsVolume, 0);

      return {
        ...supplierData,
        supplyUnits: supplierSupplyUnits,
        volume: supplierTotalVolume,
        value: supplierScore
      };
    });
    return suppliersWithScore;
});


export const computeSuppliersWithScoreAndVolume = createSelector(
  [getCurrentSuppliersWithScore, getParcelsByCountryAndBlend, computeParcelsVolume],
  (suppliersWithScores, parcels, totalVolume) => {
    const allSuppliers = parcels.map(p => ({
      id: p.supplier.id,
      volume: p.volume
    }));
    const suppliersGroupedById = groupBy(allSuppliers, 'id');
    const suppliers = orderBy(Object.keys(suppliersGroupedById).map((key) => ({
      ...suppliersWithScores.find(s => s.id === key),
      volume: sumBy(suppliersGroupedById[key], 'volume') / totalVolume,
      volumeAbs: sumBy(suppliersGroupedById[key], 'volume')
    })), 'volume', 'desc');

    return suppliers;
});



export const computeAllSuppliersResolvedScoreBuckets = createSelector(
  [getCurrentSuppliersWithScore, getCurrentScoreBucketConfig],
  (suppliers, scoreBucketConfig) => {
    const suppliersBuckets = suppliers.map(supplier => {
      let bucket;
      if (supplier.value) {
        const supplierScoreBuckets = resolveBuckets([{ value: supplier.value }], scoreBucketConfig);
        bucket = supplierScoreBuckets[0];
      } else {
        console.warn('Supplier without score', supplier);
      }
      return {
        ...supplier,
        bucket
      };
    });

    // Temporary: normally all SUs should have values (currently all of shapefile SUs)
    const suppliersBucketsFiltered = suppliersBuckets.filter(supplierScore => supplierScore.bucket !== null && supplierScore.bucket !== undefined);
    return orderBy(suppliersBucketsFiltered, 'volume', 'desc');
  }
);


export const computeAllSuppliersResolvedVolumeBuckets = createSelector(
  [computeSuppliersWithScoreAndVolume, getCurrentVolumeBucketConfig, computeParcelsVolume],
  (suppliers, volumeBucketConfig, totalVolume) => {
    const suppliersBuckets = suppliers.map(supplier => {
      let bucket;
      if (supplier.volumeAbs) {
        const supplierScoreBuckets = resolveBuckets([{ value: supplier.volumeAbs }], volumeBucketConfig, totalVolume);
        bucket = supplierScoreBuckets[0];
      } else {
        console.warn('Supplier without volume', supplier);
      }
      return {
        ...supplier,
        bucket
      };
    });

    // Temporary: normally all SUs should have values (currently all of shapefile SUs)
    return suppliersBuckets.filter(supplierScore => supplierScore.bucket !== null && supplierScore.bucket !== undefined);
  }
);


// returns all countries in store and attach geoms to them (when available)
export const getCountriesWithGeoms = createSelector(
  [getCountries, getCountriesGeoms],
  (countries, countriesGeom) => {
    return countries.map(country => {
      // TODO: using country.label is not clean
      const countryGeom = countriesGeom.find(cg => cg.properties.NAME === country.label);
      return {
        ...country,
        type: 'Feature',
        geometry: countryGeom.geometry
      };
    });
  }
);

export const getCountriesWithVolume = createSelector(
  [getParcelsByCountryAndBlend, getCountries],
  (parcels, countries) => {
    const parcelsByCountry = groupBy(parcels, 'country.id');
    const countriesVolume = countries.map(c => {
      return ({
        ...c,
        volume: sumBy(parcelsByCountry[c.id], 'volume')
      });
    });
    return countriesVolume;
  }
);
