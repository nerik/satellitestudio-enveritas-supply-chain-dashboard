import { connect } from 'react-redux';
import OrderedList from './OrderedList';
import { PAGE_ITEMS } from '../constants';

const mapStateToProps = ({ location }, { paginateId, items }) => {
  if (!paginateId) return { items };
  const page = location.query ? parseInt(location.query[paginateId], 10) || 0 : 0;
  const start = page * PAGE_ITEMS;
  const end = (page + 1) * PAGE_ITEMS;
  const paginatedItems = items.slice(start, end);
  const hasMoreElements = items.length - end > 0;
  return {
    page,
    hasMoreElements,
    query: location.query,
    items: paginatedItems,
  };
};

const mapDispatchToProps = (dispatch) => ({
  onPaginationChange: (query) => dispatch({
    type: 'HOME',
    query
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(OrderedList);
