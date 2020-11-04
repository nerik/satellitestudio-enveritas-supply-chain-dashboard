import { connect } from 'react-redux';
import FragmentMenu from './FragmentMenu';
import  { createSelector, createStructuredSelector } from 'reselect';
import { getCurrentFilters, getAvailableFilters } from '../app/selectors';

const getMenu = (state, props) => props.menu;
// Needs a new function to not memoize same instance for different props
// https://github.com/reduxjs/reselect#sharing-selectors-with-props-across-multiple-component-instances
const getFilterByMenu = () => createSelector(
  [getAvailableFilters, getCurrentFilters, getMenu],
  (availableFilters, currentFilters, menu) => ({
    values: (menu.values === undefined) ? availableFilters[menu.id] : menu.values,
    selected: currentFilters[menu.id],
    id: menu.id
  })
);

const mapStateToProps = createStructuredSelector({
  filter: getFilterByMenu()
});

const mapDispatchToProps = (dispatch) => ({
  setFilter: (params) => {
    const key = Object.keys(params)[0];
    const query = {
      ...params
    };
    // Needs to reset the page in case there are least elements
    // per page in the new selection
    if (key === 'country') {
      query.sankeyPage = 0;
      query.mapPage = 0;
    }
    dispatch({ type: 'HOME', query });
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(FragmentMenu);
