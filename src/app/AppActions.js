import { isArray } from 'lodash';

export const SET_FILTER = 'SET_FILTER';
export const HIGHLIGHT_SUPPLY_UNIT = 'HIGHLIGHT_SUPPLY_UNIT';
export const HIGHLIGHT_COUNTRY = 'HIGHLIGHT_COUNTRY';
export const HIGHLIGHT_SUPPLIER = 'HIGHLIGHT_SUPPLIER';
export const HIGHLIGHT_LINK = 'HIGHLIGHT_LINK';
export const HIGHLIGHT_BUCKETS = 'HIGHLIGHT_BUCKETS';

export const setFilter = (filterId, value) => ({
  type: SET_FILTER,
  filterId,
  value
});

export const highlightSupplyUnit = (supplyUnit = null) => ({
  type: HIGHLIGHT_SUPPLY_UNIT,
  supplyUnit
});

export const highlightCountry = country => ({
  type: HIGHLIGHT_COUNTRY,
  country
});

export const highlightLink = (link = null) => ({
  type: HIGHLIGHT_LINK,
  link
});

export const highlightSupplier = (suppliers = []) => ({
  type: HIGHLIGHT_SUPPLIER,
  supplier: isArray(suppliers) ? suppliers : [suppliers]
});

export const highlightBuckets = (buckets) => ({
  type: HIGHLIGHT_BUCKETS,
  buckets
});
