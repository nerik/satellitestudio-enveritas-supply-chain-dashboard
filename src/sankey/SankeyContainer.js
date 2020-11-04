import { connect } from 'react-redux';
import { highlightSupplyUnit, highlightSupplier, highlightLink } from '../app/AppActions';
import { sankeyMapStateToProps } from './SankeySelectors';
import Sankey from './Sankey';

const mapStateToProps = sankeyMapStateToProps;

const mapDispatchToProps = (dispatch) => ({
  onLinkHighlight: ({ id } = {}) => {
    dispatch(highlightLink(id));
  },
  onNodeHighlight: (item, columnId) => {
    if (columnId === 'suppliers') {
      let suppliers = item && item.id;
      if (suppliers === 'others') {
        suppliers = item.suppliersIds;
      };
      dispatch(highlightSupplier(suppliers));
    } else {
      let supplyUnit = item && item.id;
      dispatch(highlightSupplyUnit(supplyUnit));
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Sankey);
