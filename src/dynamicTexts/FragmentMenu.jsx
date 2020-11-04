import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './DynamicText.module.css';

class FragmentMenu extends Component {
  onChange = (e) => {
    const { setFilter, filter } = this.props;
    if (setFilter !== undefined) {
      const query = {
        [filter.id]: e.target.value
      };
      setFilter(query);
    }
  }

  render() {
    const { values, selected, id } = this.props.filter;
    const selectedOption = values.find(v => v.id === selected) || values[0];

    return (
      <div className={styles.select}>
        <span
          className={cx(styles.fragment, styles.label)}
        >
          {selectedOption && selectedOption.label}
        </span>
        <select
          id={id} key={id}
          value={selected}
          onChange={this.onChange}
          className={styles.menu}
          ref={(select) => { this.select = select; }}
        >
          {values && values.map(value => (
            <option key={value.id} value={value.id}>{value.label}</option>
          ))}
        </select>
      </div>
    );
  }
}

FragmentMenu.propTypes = {
  // Callback to set an app-wide filter from dropdowns
  setFilter: PropTypes.func.isRequired,
  filter: PropTypes.shape({
    values: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
    })),
    id: PropTypes.string,
    selected: PropTypes.string,
  }).isRequired,
};

export default FragmentMenu;
