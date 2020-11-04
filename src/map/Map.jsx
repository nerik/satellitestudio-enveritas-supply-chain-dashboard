import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import ReactTooltip from 'react-tooltip';
import { defaultFilters } from '../app/selectors';
import SupplyUnitTooltip from '../scoreWheel/SupplyUnitTooltipContainer';
import HighlightedPolygon from './HighlightedGeometryContainer';
import styles from './Map.module.css';

import {
  BASE_HEIGHT,
  BASE_WIDTH,
  geoPath
} from './MapUtils';

const getTransform = (countries, currentCountry, path) => {
  if (currentCountry === defaultFilters.country) {
    return {
      x: BASE_WIDTH / 2,
      y: BASE_HEIGHT / 2,
      k: 1
    };
  }
  const centroid = path.centroid(
    countries.find((c) => c.id === currentCountry)
  );

  return {
    x: centroid[0],
    y: centroid[1],
    k: 3
  };
};

class Map extends Component {
  componentDidUpdate = () => {
    ReactTooltip.rebuild();
  };

  renderDefs() {
    const dropShadows = [
      {
        id: 'mapShadowCountry',
        stdDeviation: 9,
        slope: 0.25
      },
      {
        id: 'mapShadowSupplyUnit',
        stdDeviation: 2,
        slope: 0.4
      }
    ].map((gradient) => (
      <filter
        key={gradient.id}
        id={gradient.id}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feOffset result="offOut" in="SourceAlpha" dx="0" dy="0" />
        <feGaussianBlur
          result="blurOut"
          in="offOut"
          stdDeviation={gradient.stdDeviation}
        />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        <feComponentTransfer>
          <feFuncA type="linear" slope={gradient.slope} />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    ));
    return <defs>{dropShadows}</defs>;
  }

  render() {
    const {
      countries,
      isCountryMode,
      otherCountries,
      supplyUnits,
      currentCountry,
      onCountryClick,
      onCountryHighlight,
      onSupplyUnitHighlight
    } = this.props;

    const transformCoords = getTransform(countries, currentCountry, geoPath);
    const transform = `translate(${BASE_WIDTH / 2},${BASE_HEIGHT / 2})scale(${
      transformCoords.k
    })translate(${-transformCoords.x},${-transformCoords.y})`;

    return (
      <div className={styles.Map}>
        <svg height={BASE_HEIGHT} width={BASE_WIDTH}>
          {this.renderDefs()}
          <g className={styles.container} transform={transform}>
            <g>
              {otherCountries.map((d, i) => (
                <path
                  key={d.properties.NAME}
                  className={cx(
                    styles.country,{
                    [styles.disabled]: isCountryMode
                  })}
                  d={geoPath(d)}
                />
              ))}
            </g>
            <g>
              {countries.map((d) => (
                <path
                  key={d.id}
                  className={cx(
                    styles.country,
                    styles.active, {
                      [styles.secondary]: isCountryMode,
                      [styles.selected]: d.id === currentCountry
                  })}
                  data-for="mapCountryTooltip"
                  data-tip={d.label}
                  d={geoPath(d)}
                  style={{ fill: d.bucket.color }}
                  onClick={() => {
                    onCountryClick(d.id);
                    ReactTooltip.hide();
                  }}
                  onMouseEnter={() => {
                    onCountryHighlight(d.id);
                  }}
                  onMouseLeave={() => {
                    onCountryHighlight(null);
                  }}
                />
              ))}
            </g>
            <g>
              {supplyUnits.map((d) => {
                return (
                  <path
                    key={d.key || d.id}
                    className={cx(styles.supplyUnit, {
                      [styles.active]: d.supplyUnitId !== undefined
                    })}
                    d={geoPath(d)}
                    style={{ fill: (d.bucket && d.bucket.color) || '#F2F5F4' }}
                    data-for="supplyUnit"
                    data-tip={d.id}
                    onMouseEnter={() => {
                      onSupplyUnitHighlight(d.supplyUnitId);
                    }}
                    onMouseLeave={() => {
                      onSupplyUnitHighlight(null);
                    }}
                  />
                );
              })}
            </g>
            <HighlightedPolygon />
          </g>
        </svg>
        <ReactTooltip
          id="supplyUnit"
          type={'light'}
          className={styles.tooltip}
        >
          <SupplyUnitTooltip />
        </ReactTooltip>
        <ReactTooltip
          id="mapCountryTooltip"
          type={'light'}
          className={styles.tooltip}
        />
      </div>
    );
  }
}

Map.propTypes = {
  // An array GeoJSON objects representing all available countries
  countries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      geometry: PropTypes.object
    })
  ).isRequired,
  // An array GeoJSON objects representing non-available countries (the basemap)
  otherCountries: PropTypes.arrayOf(
    PropTypes.shape({
      properties: PropTypes.shape({
        NAME: PropTypes.string
      }),
      geometry: PropTypes.object
    })
  ).isRequired,
  // An array GeoJSON objects representing all available supplyUnits
  supplyUnits: PropTypes.array.isRequired,
  currentCountry: PropTypes.string.isRequired,
  isCountryMode: PropTypes.bool.isRequired,
  onCountryClick: PropTypes.func.isRequired,
  onCountryHighlight: PropTypes.func.isRequired,
  onSupplyUnitHighlight: PropTypes.func.isRequired
};

export default Map;
