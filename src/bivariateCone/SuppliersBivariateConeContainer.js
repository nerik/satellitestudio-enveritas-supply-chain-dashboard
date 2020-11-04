import { connect } from 'react-redux';
import { highlightSupplier } from '../app/AppActions';
import BivariateCone from './BivariateCone';
import { getSankeyPage, getSankeyDimension } from '../app/selectors';
import {
  getCurrentHighlightedSuppliers,
  computeAllSuppliersResolvedScoreBuckets,
  computeAllSuppliersResolvedVolumeBuckets
} from '../app/selectors';
import { PAGE_ITEMS } from '../constants';
import { createSelector } from 'reselect';

const getScoreBuckets = createSelector(
  [getSankeyPage, computeAllSuppliersResolvedScoreBuckets], (page, scoreBuckets) => {
    const start = page * PAGE_ITEMS;
    const end = (page + 1) * PAGE_ITEMS;
    return scoreBuckets
      .map((su, i) => ({ ...su, blurred: i < start || i > end }))
      .sort((a, b) => b.blurred - a.blurred);
});

const mapStateToProps = state => ({
  title: 'Suppliers',
  mode: getSankeyDimension(state),
  scoreBuckets: getScoreBuckets(state),
  volumeBuckets: computeAllSuppliersResolvedVolumeBuckets(state),
  highlightedItems: getCurrentHighlightedSuppliers(state)
});

const mapDispatchToProps = (dispatch) => ({
  onBucketHighlight: () => {},
  onPointHighlight: ({ id } = {}) => {
    dispatch(highlightSupplier(id));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(BivariateCone);
