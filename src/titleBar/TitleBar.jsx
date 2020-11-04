import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logo from './logo.svg';
import styles from './TitleBar.module.css';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import Filter from './Filter';

class TitleBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchHidden: true,
      searchFilter: ''
    };
  }

  attachClickListener() {
    document.addEventListener('mousedown', this.handleClick);
  }

  removeClickListener() {
    document.removeEventListener('mousedown', this.handleClick);
  }

  handleClick = (e) => {
    const isClickInside = this.node.contains(e.target);
    if (!isClickInside) {
      this.setState({ searchHidden: true, searchFilter: '' });
      this.removeClickListener();
    }
  }

  toggleSearchMenu = () => {
    if (this.state.searchHidden) this.attachClickListener();
    this.setState({
      searchHidden: !this.state.searchHidden,
      searchFilter: ''
    });
  }

  onInputChange = (e) => {
    this.setState({
      searchFilter: e.target.value
    });
  }

  getFiltersBySearch(filters, search) {
    if (!search) return filters;
    return filters.filter(f => f.label && f.label.toUpperCase().includes(search.toUpperCase()));
  }

  handleFilterClick = (type, filter) => {
    const { onFilterClick } = this.props;
    onFilterClick({ [type]: filter });
    this.setState({ searchHidden: false });
  }

  render() {
    const { searchFilter } = this.state;
    const { availableFilters, filters } = this.props;
    return (
      <div ref={(node) => this.node = node} className={styles.TitleBar}>
        {this.state.searchHidden ?
          <div className={styles.topBar}>
            <img src={logo} className={styles.logo} alt='Enveritas logo' />
            <div className={styles.currentFilters}>
              <span onClick={this.toggleSearchMenu}>{filters.blend}</span>
              <span onClick={this.toggleSearchMenu}>{filters.country}</span>
              <span onClick={this.toggleSearchMenu}>{filters.pillar}</span>
            </div>
            <button
              className={styles.toggleSearchButton}
              aria-label='Search'
              onClick={this.toggleSearchMenu}
            >
              <SearchIcon/>
            </button>
          </div>
        :
          <div className={styles.searchMenu}>
            <div className={styles.topBar}>
              <SearchIcon className={styles.searchInputIcon}/>
              <input
                autoFocus
                type='search'
                value={searchFilter}
                onChange={this.onInputChange}
                className={styles.searchInput}
                placeholder='Search (by blend, region or pillar)'
              />
              <button className={styles.toggleSearchButton} aria-label='Close search' onClick={this.toggleSearchMenu}>
                <CloseIcon/>
              </button>
            </div>
            <div className={styles.filters}>
              <Filter
                title="Blend"
                items={this.getFiltersBySearch(availableFilters.blend, searchFilter)}
                onClick={(filter) => this.handleFilterClick('blend', filter)}
              />
              <Filter
                title="Country"
                items={this.getFiltersBySearch(availableFilters.country, searchFilter)}
                onClick={(filter) => this.handleFilterClick('country', filter)}
              />
              <Filter
                title="Pillar"
                items={this.getFiltersBySearch(availableFilters.pillar, searchFilter)}
                onClick={(filter) => this.handleFilterClick('pillar', filter)}
              />
            </div>
          </div>
        }
      </div>

    );
  }
}

TitleBar.propTypes = {
  // An array of all available filters, needed to populate dropdowns
  availableFilters: PropTypes.object.isRequired,
  // Currently selected app wide filters
  filters: PropTypes.object.isRequired,
  // Handles the filtered click
  onFilterClick: PropTypes.func.isRequired
};

export default TitleBar;
