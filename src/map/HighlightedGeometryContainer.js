import { connect } from 'react-redux';
import HighlightedGeometry from './HighlightedGeometry';
import { highlightSupplyUnit, highlightCountry } from '../app/AppActions';
import {
  defaultFilters,
  getCurrentCountry,
  getCurrentHighlightedCountry,
  getCurrentHighlightedSupplyUnit
} from '../app/selectors';
import {
  filterSupplyUnitsByCurrentCountry,
  attachCountriesBuckets
} from './MapSelectors';
import { createSelector } from 'reselect';

const isCountry = createSelector(
  [getCurrentCountry],
  (currentCountry) => currentCountry === defaultFilters.country
);

const getHighlihgtedGeometry = createSelector(
  [
    isCountry,
    attachCountriesBuckets,
    filterSupplyUnitsByCurrentCountry,
    getCurrentHighlightedCountry,
    getCurrentHighlightedSupplyUnit
  ],
  (
    isCountryMode,
    countries,
    supplyUnits,
    currentHighlightedCountry,
    currentHighlightedSupplyUnit
  ) => {
    let highlightedGeometry;
    if (isCountryMode) {
      highlightedGeometry = countries.find(
        (c) => c.id === currentHighlightedCountry
      );
    } else {
      highlightedGeometry = supplyUnits.find(
        (c) => c.supplyUnitId === currentHighlightedSupplyUnit
      );
    }
    return highlightedGeometry;
  }
);

const mapStateToProps = (state) => {
  return {
    isCountry: isCountry(state),
    highlightedGeometry: getHighlihgtedGeometry(state)
  };
};

const mapDispatchToProps = (dispatch) => ({
  onCountryHighlight: (country) => dispatch(highlightCountry(country)),
  onSupplyUnitHighlight: (su) => dispatch(highlightSupplyUnit(su))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HighlightedGeometry);
