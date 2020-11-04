import { connect } from 'react-redux';
import OrderedList from '../orderedList/OrderedListContainer';
import { isCountryMode } from '../app/selectors';
import { getListCountries, getListSupplyUnits } from './MapListSelectors';
import { highlightSupplyUnit, highlightCountry } from '../app/AppActions';

const mapStateToProps = (state) => {
  return {
    items: isCountryMode(state)
      ? getListSupplyUnits(state)
      : getListCountries(state),
    paginateId: 'mapPage',
    isCountryMode: isCountryMode(state)
  };
};

const mapDispatchToProps = (dispatch) => ({
  highlightSupplyUnit: (id) => dispatch(highlightSupplyUnit(id)),
  highlightCountry: (id) => dispatch(highlightCountry(id))
});

const mergeStateDispatchToProps = (state, dispatch) => ({
  ...state,
  ...dispatch,
  // Not a good practice... but needed to keep the list
  // agnostic of the geomtry to highlight
  onListHighlight: ({ id } = {}) => {
    if (state.isCountryMode) {
      dispatch.highlightSupplyUnit(id);
    } else {
      dispatch.highlightCountry(id);
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps, mergeStateDispatchToProps)(OrderedList);
