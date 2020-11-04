import { connect } from 'react-redux';
import TitleBar from './TitleBar';
import { upperFirst } from 'lodash';
import { getAvailableFiltersWithActive } from '../app/selectors';
import { createSelector, createStructuredSelector } from 'reselect';

const getFilterLabels = createSelector(
  [getAvailableFiltersWithActive],
  (availableFilters) => {
  const country = availableFilters.country.find(f => f.active);
  const blend = availableFilters.blend.find(f => f.active);
  const pillar = availableFilters.pillar.find(f => f.active);
  return {
    country: country && upperFirst(country.label),
    blend: blend && upperFirst(blend.label),
    pillar: pillar && upperFirst(pillar.label)
  };
});
const mapStateToProps = createStructuredSelector({
  filters: getFilterLabels,
  availableFilters: getAvailableFiltersWithActive
});

const mapDispatchToProps = (dispatch) => ({
  onFilterClick: (query) => {
    dispatch({
      type: 'HOME',
      query
    });
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TitleBar);
