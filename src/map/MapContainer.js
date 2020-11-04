import { connect } from 'react-redux';
import Map from './Map';
import {
  getCurrentCountry,
  isCountryMode,
} from '../app/selectors';
import {
  filterSupplyUnitsByCurrentCountry,
  attachCountriesBuckets
} from './MapSelectors';

import { highlightSupplyUnit, highlightCountry } from '../app/AppActions';

const mapStateToProps = state => ({
  currentCountry: getCurrentCountry(state),
  countries: attachCountriesBuckets(state),
  isCountryMode: isCountryMode(state),
  otherCountries: state.app.geoms.otherCountries,
  supplyUnits: filterSupplyUnitsByCurrentCountry(state),
  currentHighlightedBuckets: state.app.currentHighlightedBuckets
});

const mapDispatchToProps = (dispatch) => ({
  onCountryClick: (country) => dispatch({
    type: 'HOME',
    query: { country }
  }),
  onCountryHighlight: (country) => dispatch(highlightCountry(country)),
  onSupplyUnitHighlight: (su) => dispatch(highlightSupplyUnit(su)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Map);
