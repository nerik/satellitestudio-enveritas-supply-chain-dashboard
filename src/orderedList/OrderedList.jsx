import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './OrderedList.module.css';
import cs from 'classnames';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';

class OrderedListItem extends Component {
  render() {
    const { label, value, id, onMouseEnter, onMouseLeave } = this.props;
    return (
      <li
        className={styles.row}
        onMouseEnter={() => onMouseEnter({ id })}
        onMouseLeave={() => onMouseLeave({ id: undefined })}
      >
        <span className={styles.name}>{label}</span>
        <span className={styles.value}>{value}</span>
      </li>
    );
  }
}

OrderedListItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string]).isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
};

class OrderedList extends Component {
  onPrevClick = () => {
    this.handlePaginationChange(-1);
  }
  onNextClick = () => {
    this.handlePaginationChange(1);
  }
  handlePaginationChange(nextPage) {
    const { query, page, paginateId, onPaginationChange } = this.props;
    onPaginationChange({
      ...query,
      [paginateId]: page + nextPage
    });
  }

  render() {
    const { items, paginateId, page, hasMoreElements, onListHighlight } = this.props;
    return (
      <div className={styles.OrderedList}>
        <ol>
          {items.map((item, i) => (
            <OrderedListItem
              key={i}
              {...item}
              onMouseEnter={onListHighlight}
              onMouseLeave={onListHighlight}
            />
          ))}
        </ol>
        {paginateId &&
          <div className={styles.arrows}>
            <button onClick={this.onPrevClick} className={cs(styles.arrowButton, {[styles.disabled]: page < 1})} aria-label="Prev">
              <KeyboardArrowUp />
            </button>
            <button onClick={this.onNextClick} className={cs(styles.arrowButton, {[styles.disabled]: !hasMoreElements})} aria-label="Next">
              <KeyboardArrowDown />
            </button>
          </div>
        }
      </div>
    );
  }
}

OrderedList.propTypes = {
  // An array of list items (see OrderedListItem component)
  items: PropTypes.array.isRequired,
  // Show | hide the next page button
  hasMoreElements: PropTypes.bool,
  // Query params already existing
  query: PropTypes.object,
  // Identifier for the pagination param
  paginateId: PropTypes.string,
  // Curent page
  page: PropTypes.number,
  // On pagination change callback
  onPaginationChange: PropTypes.func,
  onListHighlight: PropTypes.func,
};

OrderedList.defaultProps = {
  hasMoreElements: false,
  onPaginationChange: () => {},
  onListHighlight: () => {},
  paginateId: null,
  page: 0,
  query: null
};

export default OrderedList;
