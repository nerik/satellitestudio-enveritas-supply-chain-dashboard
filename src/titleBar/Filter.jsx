import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { upperFirst } from 'lodash';
import cx from 'classnames';
import styles from './TitleBar.module.css';

class Filter extends Component {
  render() {
    const { title, items, placeholder, onClick } = this.props;
    return (
      <div className={styles.filter}>
        <ul>
          <div className={styles.filterLabel}>{title}</div>
          {items && items.length > 0
            ? items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => onClick(item.id)}
                  className={cx(styles.filterItem, {[styles.filterItemActive]: item.active})}
                >
                  {upperFirst(item.label)}
                </li>
              ))
            : <li className={styles.placeholder}>{placeholder}</li>
          }
        </ul>
      </div>
    );
  }
}

Filter.propTypes = {
  // Title of the list
  title: PropTypes.string.isRequired,
  // An array of id, label tuples
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
  }),).isRequired,
  // Literal to show
  placeholder: PropTypes.string,
  // Selection click handler
  onClick: PropTypes.func.isRequired,
};

Filter.defaultProps = {
  placeholder: 'No matching results'
};

export default Filter;
