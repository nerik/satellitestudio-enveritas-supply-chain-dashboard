import { createSelector } from 'reselect';
import { getMapListDimension } from '../app/selectors';
import {
  attachCountriesBuckets,
  filterSupplyUnitsByCurrentCountry
} from '../map/MapSelectors';
import { orderBy } from 'lodash';

const getWithVibariateScore = (list) => list.map(l => ({
  ...l,
  bivariate: l.value * l.volume
}));

export const getListCountries = createSelector(
  [attachCountriesBuckets],
  (countries) => {
    return orderBy(countries.map((c) => {
      return {
        id: c.id,
        label: c.label,
        value: Math.round(c.bucket.volume)
      };
    }), 'value', 'desc');
  }
);

export const getListSupplyUnits = createSelector(
  [filterSupplyUnitsByCurrentCountry, getMapListDimension],
  (supplyUnits, mapDimension) => {
    let order = mapDimension;
    const supplyUnitsWithVibariate = getWithVibariateScore(supplyUnits);
    if (mapDimension !== 'bivariate') {
      order = mapDimension === 'score' ? 'value' : 'volume';
    }
    const supplyUnitsOrdered = orderBy(supplyUnitsWithVibariate, order, 'desc');
    return supplyUnitsOrdered
      .filter((su) => su.bucketIndexes)
      .map((su) => {
        const score = Math.round(su.value * 100);
        const volume = `${Math.round(su.volume)} T`;
        // Some space between 'columns'
        const space = '\u00A0\u00A0\u00A0\u00A0';
        const value = {
          volume,
          score,
          'bivariate': `${volume} ${space} ${score}`
        }[mapDimension];
        return {
          id: su.supplyUnitId,
          label: su.label,
          value
        };
      });
  }
);
