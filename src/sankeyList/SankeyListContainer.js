import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { orderBy } from 'lodash';
import {
  getSankeyDimension,
  computeSuppliersWithScoreAndVolume,
  computeParcelsVolume
} from '../app/selectors';
import OrderedList from '../orderedList/OrderedListContainer';
import { highlightSupplier } from '../app/AppActions';

const getWithVibariateScore = (list) => list.map(l => ({
  ...l,
  bivariate: l.value * l.volume
}));

const computeSuppliersListOrdered = createSelector(
  [
    computeSuppliersWithScoreAndVolume,
    computeParcelsVolume,
    getSankeyDimension
  ],
  (suppliers, totalVolume, sankeyDimension) => {
    let order = sankeyDimension;
    const suppliersWithVibariate = getWithVibariateScore(suppliers);
    if (sankeyDimension !== 'bivariate') {
      order = sankeyDimension === 'score' ? 'value' : 'volume';
    }
    const suppliersOrdered = orderBy(suppliersWithVibariate, order, 'desc');
    return suppliersOrdered.map((su) => {
      const volume = `${Math.round(su.volume * totalVolume)}T | ${(su.volume * 100).toFixed(2)}%`;
      const score = Math.round(su.value * 100);
      const space = '\u00A0\u00A0\u00A0\u00A0';
      const value = {
        volume,
        score,
        'bivariate': `${volume} ${space} ${score}`
      }[sankeyDimension];
      return {
        id: su.id,
        label: su.id,
        value,
      };
    });
  }
);

const mapStateToProps = (state) => ({
  items: computeSuppliersListOrdered(state),
  paginateId: 'sankeyPage'
});

const mapDispatchToProps = (dispatch) => ({
  onListHighlight: ({ id } = {}) => {
    dispatch(highlightSupplier(id));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(OrderedList);
