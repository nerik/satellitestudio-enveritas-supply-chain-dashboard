import { connect } from 'react-redux';
import { highlightBuckets } from '../app/AppActions';
import BivariateCone from './BivariateCone';
import {
  isCountryMode,
  getMapListDimension,
  getCurrentHighlightedCountry,
  getCurrentHighlightedSupplyUnit,
  computeAllSupplyUnitsResolvedScoreBuckets,
  computeAllSupplyUnitsResolvedVolumeBuckets
} from '../app/selectors';
import { highlightSupplyUnit, highlightCountry } from '../app/AppActions';
import { attachCountriesBuckets } from '../map/MapSelectors';

const mapStateToProps = (state) => {
  const isCountry = isCountryMode(state);
  return {
    title: 'Supply units',
    isCountryMode: isCountry,
    mode: isCountry ? getMapListDimension(state) : 'volume',
    scoreBuckets: isCountry
      ? computeAllSupplyUnitsResolvedScoreBuckets(state)
      : attachCountriesBuckets(state),
    volumeBuckets: isCountry
      ? computeAllSupplyUnitsResolvedVolumeBuckets(state)
      : attachCountriesBuckets(state),
    highlightedItems: isCountry
      ? getCurrentHighlightedSupplyUnit(state)
      : getCurrentHighlightedCountry(state)
  };
};

const mapDispatchToProps = (dispatch) => ({
  onBucketHighlight: (buckets) => {
    dispatch(highlightBuckets(buckets));
  },
  highlightSupplyUnit: (id) => dispatch(highlightSupplyUnit(id)),
  highlightCountry: (id) => dispatch(highlightCountry(id))
});

const mergeStateDispatchToProps = (state, dispatch) => ({
  ...state,
  ...dispatch,
  // Not a good practice... but needed to keep the bivariate
  // agnostic of the geomtry to highlight
  onPointHighlight: ({ id } = {}) => {
    if (state.isCountryMode) {
      dispatch.highlightSupplyUnit(id);
    } else {
      dispatch.highlightCountry(id);
    }
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeStateDispatchToProps
)(BivariateCone);
