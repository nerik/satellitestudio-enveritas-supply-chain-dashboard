import React, { Fragment } from 'react';
import ReactTooltip from 'react-tooltip';
import cx from 'classnames';
import styles from './Map.module.css';
import { geoPath } from './MapUtils';

const HighlightedPolygon = React.memo(({ isCountry, highlightedGeometry }) => {
  if (!highlightedGeometry) return null;
  return (<Fragment>
    <g>
      <path
        className={cx(styles.highlighted, {
          [styles.country]: isCountry,
          [styles.supplyUnit]: !isCountry
        })}
        d={geoPath(highlightedGeometry)}
        style={{ fill: highlightedGeometry.bucket && highlightedGeometry.bucket.color }}
        />
    </g>
    <ReactTooltip
      id='supplyUnit'
      type={'light'}
      className={styles.tooltip}
    >
      <span>{highlightedGeometry.label}</span>
    </ReactTooltip>
  </Fragment>);
});

export default HighlightedPolygon;
